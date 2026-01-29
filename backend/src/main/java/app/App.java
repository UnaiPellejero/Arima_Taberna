package app;

import java.io.FileInputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;

import static spark.Spark.get;
import static spark.Spark.port;
import static spark.Spark.post;
import static spark.Spark.staticFiles;

public class App {
    private static String DB_URL;
    private static String DB_USER;
    private static String DB_PASS;

    public static void main(String[] args) {

        cargarConfiguracion(); 

        // Configuración de archivos estáticos
        staticFiles.location("public/frontend");
        port(4568);
        
        get("/", (req, res) -> {
            res.redirect("/index.html");
            return null;
        });

        // Ruta de Login (Sin cambios)
    post("/login-auth", (req, res) -> {
    String identificador = req.queryParams("email");
    String pass = req.queryParams("password");
    
    String sql = "SELECT id, usuario, email, telefono, tipo FROM Arima_BD.usuarios " +
                 "WHERE (usuario = ? OR email = ?) AND contrasena = ?";
    
    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, identificador);
        ps.setString(2, identificador);
        ps.setString(3, pass);
        
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                int tipo = rs.getInt("tipo");
                req.session().attribute("user_id", rs.getInt("id"));
                req.session().attribute("user_tipo", tipo);
                req.session().attribute("user_nombre", rs.getString("usuario"));
                req.session().attribute("user_email", rs.getString("email"));      // <--- AÑADIR ESTO
                req.session().attribute("user_telefono", rs.getString("telefono")); // <--- AÑADIR ESTO
                
                // Enviamos el tipo al frontend para que decida la redirección
                return String.valueOf(tipo); 
            }
        }
    } catch (SQLException e) { e.printStackTrace(); }
    
    res.status(401);
    return "error";
});
post("/reservar", (req, res) -> {
    try {
        Integer idCliente = req.session().attribute("user_id");
        String fecha = req.queryParams("fecha");
        String hora = req.queryParams("hora");
        int personas = Integer.parseInt(req.queryParams("personas"));
        String nombre = req.queryParams("nombre");
        String telefono = req.queryParams("telefono");
        String comentarios = req.queryParams("comentarios");

        boolean exito = registrarReserva(fecha, hora, personas, nombre, telefono, comentarios, idCliente);
        return exito ? "success" : "error";
    } catch (Exception e) {
        e.printStackTrace();
        return "error";
    }
});

        // --- RUTA DE REGISTRO ACTUALIZADA ---
        post("/registro", (req, res) -> {
            String user = req.queryParams("usuario");
            String email = req.queryParams("email");
            String pass = req.queryParams("password");
            String telf = req.queryParams("telefono"); // <--- Nuevo campo capturado

            // Pasamos el teléfono al método SQL
            boolean exito = registrarUsuario(user, email, pass, telf, 2);
            return exito ? "success" : "error";
        });
        //Ruta usuario actual
        get("/api/usuario-actual", (req, res) -> {
        res.type("application/json");
        if (req.session().attribute("user_id") == null) {
            return "{}";
        }
    // Devolvemos un JSON con los datos de la sesión
    return String.format(
        "{\"nombre\":\"%s\", \"email\":\"%s\", \"telefono\":\"%s\"}",
        req.session().attribute("user_nombre"),
        req.session().attribute("user_email"),
        req.session().attribute("user_telefono")
    );
});
post("/api/admin/reservas/actualizar", (req, res) -> {
    // NOTA: Se añadió una coma después de comentarios=?
    String sql = "UPDATE Arima_BD.reservas SET nombre=?, telefono=?, fecha=?, hora=?, personas=?, comentarios=?, id_mesa=? WHERE id_reserva=?";
    
    String[] parts = req.queryParams("fechaHora").split("T"); 
    
    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, req.queryParams("nombre"));
        ps.setString(2, req.queryParams("tel"));
        ps.setString(3, parts[0]);
        ps.setString(4, parts[1]);
        ps.setInt(5, Integer.parseInt(req.queryParams("pax")));
        ps.setString(6, req.queryParams("comentarios"));
        ps.setInt(7, Integer.parseInt(req.queryParams("idMesa"))); // Índice 7
        ps.setInt(8, Integer.parseInt(req.queryParams("id")));     // Índice 8 (el WHERE)
        
        return ps.executeUpdate() > 0 ? "success" : "error";
    } catch (Exception e) { e.printStackTrace(); return "error"; }
});
        // --- RUTA PARA PROCESAR RESERVAS ---
        get("/api/admin/reservas", (req, res) -> {
    res.type("application/json");
    StringBuilder json = new StringBuilder("[");
    
    // Consulta para traer los datos reales de la reserva + email del cliente
    String sql = "SELECT r.id, r.nombre, u.email, r.telefono, r.fecha, r.hora, r.personas, r.comentarios, r.estado, r.id_mesa " +
             "FROM Arima_BD.reservas r " +
             "LEFT JOIN Arima_BD.usuarios u ON r.id_cliente = u.id";

    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql);
         ResultSet rs = ps.executeQuery()) {

        while (rs.next()) {
            if (json.length() > 1) json.append(",");
            json.append(String.format(
                "{\"id\":%d, \"nombre\":\"%s\", \"email\":\"%s\", \"tel\":\"%s\", \"fechaHora\":\"%s %s\", \"pax\":%d, \"comentarios\":\"%s\", \"estado\":\"%s\", \"idMesa\":%d}",
                rs.getInt("id"), rs.getString("nombre"), 
                rs.getString("email") != null ? rs.getString("email") : "N/A",
                rs.getString("telefono"), rs.getString("fecha"), rs.getString("hora"),
                rs.getInt("personas"), rs.getString("comentarios"), rs.getString("estado"),
                rs.getInt("id_mesa")
            ));
        }
    } catch (SQLException e) { e.printStackTrace(); }
    
    json.append("]");
    return json.toString();
});
    get("/api/ver-reservas", (req, res) -> {
    res.type("application/json");
    StringBuilder json = new StringBuilder("[");
    
    // Consulta que une reservas con clientes para tener toda la info
    String sql = "SELECT r.id, r.fecha, r.hora, r.personas, r.nombre, r.telefono, r.comentarios, r.estado " +
                 "FROM Arima_BD.reservas r";

    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql);
         ResultSet rs = ps.executeQuery()) {

        while (rs.next()) {
            if (json.length() > 1) json.append(",");
            json.append(String.format(
                "{\"id\":\"%s\", \"fecha\":\"%s\", \"hora\":\"%s\", \"personas\":%d, \"nombre\":\"%s\", \"tel\":\"%s\", \"estado\":\"%s\"}",
                rs.getInt("id"), rs.getString("fecha"), rs.getString("hora"), 
                rs.getInt("personas"), rs.getString("nombre"), rs.getString("telefono"), rs.getString("estado")
            ));
        }
    } catch (SQLException e) {
        e.printStackTrace();
    }
    
    json.append("]");
    return json.toString();
});

        System.out.println("Servidor de Arima Taberna funcionando en http://localhost:4568");
    }

    private static Integer buscarMesaDisponible(Connection conn, String fecha, String hora, int personas) throws SQLException {
    // Busca mesas con capacidad suficiente que NO tengan reservas 
    // en un margen de 90 minutos antes o después.
    String sql = 
        "SELECT id_mesa FROM Arima_BD.mesas " +
        "WHERE cantidad_personas >= ? " +
        "AND id_mesa NOT IN (" +
        "    SELECT id_mesa FROM Arima_BD.reservas " +
        "    WHERE fecha = ? " +
        "    AND ABS(TIMEDIFF(hora, ?)) < '01:30:00'" +
        ") " +
        "ORDER BY cantidad_personas ASC LIMIT 1";

    try (PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setInt(1, personas);
        ps.setString(2, fecha);
        ps.setString(3, hora);
        
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) return rs.getInt("id_mesa");
        }
    }
    return null; // No hay mesas disponibles
}

    // --- MÉTODOS SQL ---
/* 
    private static Integer obtenerTipoSiCredencialesValidas(String identificador, String contrasena) {
        // Mantenemos esta consulta pero asegúrate de que 'email' existe en tu BD tras los errores previos
        String sql = "SELECT tipo FROM Arima_BD.usuarios WHERE (usuario = ? OR email = ?) AND contrasena = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, identificador);
            ps.setString(2, identificador);
            ps.setString(3, contrasena);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("tipo");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    } */

    // --- MÉTODO REGISTRAR ACTUALIZADO ---
    private static boolean registrarUsuario(String usuario, String email, String contrasena, String telefono, int tipo) {
    String sqlUser = "INSERT INTO Arima_BD.usuarios (usuario, email, contrasena, telefono, tipo) VALUES (?, ?, ?, ?, ?)";
    String sqlCliente = "INSERT INTO Arima_BD.clientes (id_cliente, nombre_completo, telefono, email) VALUES (?, ?, ?, ?)";
    // Nueva SQL para la tabla empleados
    String sqlEmpleado = "INSERT INTO Arima_BD.empleados (id_empleado, nombre, rol) VALUES (?, ?, ?)";

    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
        conn.setAutoCommit(false); 

        try (PreparedStatement psUser = conn.prepareStatement(sqlUser, PreparedStatement.RETURN_GENERATED_KEYS)) {
            psUser.setString(1, usuario);
            psUser.setString(2, email);
            psUser.setString(3, contrasena);
            psUser.setString(4, telefono);
            psUser.setInt(5, tipo);
            psUser.executeUpdate();

            ResultSet rs = psUser.getGeneratedKeys();
            if (rs.next()) {
                int idGenerado = rs.getInt(1);

                // --- Lógica según el tipo de usuario ---
                if (tipo == 2) { 
                    // Caso CLIENTE
                    try (PreparedStatement psCli = conn.prepareStatement(sqlCliente)) {
                        psCli.setInt(1, idGenerado);
                        psCli.setString(2, usuario); 
                        psCli.setString(3, telefono);
                        psCli.setString(4, email);
                        psCli.executeUpdate();
                    }
                } else if (tipo == 1) { 
                    // Caso EMPLEADO
                    try (PreparedStatement psEmp = conn.prepareStatement(sqlEmpleado)) {
                        psEmp.setInt(1, idGenerado);
                        psEmp.setString(2, usuario); // Usamos el username como nombre
                        psEmp.setString(3, "Staff");  // Rol por defecto, puedes cambiarlo según necesites
                        psEmp.executeUpdate();
                    }
                }
            }
            conn.commit(); 
            return true;
        } catch (SQLException e) {
            conn.rollback(); 
            e.printStackTrace();
            return false;
        }
    } catch (SQLException e) {
        e.printStackTrace();
        return false;
    }
}

    // --- MÉTODO RESERVAR ACTUALIZADO ---
private static boolean registrarReserva(String fecha, String hora, int personas, String nombre, String telefono, String comentarios, Integer idCliente) {
    // Añadimos id_mesa a la consulta SQL
    String sqlInsert = "INSERT INTO Arima_BD.reservas (fecha, hora, personas, nombre, telefono, comentarios, id_cliente, id_mesa, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')";
    
    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
        // 1. Buscamos mesa automáticamente usando el nuevo método
        Integer mesaAsignada = buscarMesaDisponible(conn, fecha, hora, personas);
        
        if (mesaAsignada == null) return false; // Detener si no hay sitio

        // 2. Insertamos la reserva con la mesa encontrada
        try (PreparedStatement ps = conn.prepareStatement(sqlInsert)) {
            ps.setString(1, fecha);
            ps.setString(2, hora);
            ps.setInt(3, personas);
            ps.setString(4, nombre);
            ps.setString(5, telefono);
            ps.setString(6, comentarios);
            
            if (idCliente != null) ps.setInt(7, idCliente); 
            else ps.setNull(7, java.sql.Types.INTEGER);
            
            ps.setInt(8, mesaAsignada); // <--- Nueva columna id_mesa
            
            return ps.executeUpdate() > 0;
        }
    } catch (SQLException e) {
        e.printStackTrace();
        return false;
    }
}

private static void cargarConfiguracion() {
    Properties prop = new Properties();
    try (FileInputStream fis = new FileInputStream("config.properties")) {
        prop.load(fis);
        DB_URL = prop.getProperty("db.url");
        DB_USER = prop.getProperty("db.user");
        DB_PASS = prop.getProperty("db.pass");
    } catch (Exception e) {
        System.err.println("No se pudo cargar el archivo de configuración.");
        e.printStackTrace();
    }
}
}