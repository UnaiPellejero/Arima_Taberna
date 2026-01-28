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
    
    // Nueva consulta para obtener todos los datos del usuario
    String sql = "SELECT id, usuario, email, telefono, tipo FROM Arima_BD.usuarios WHERE (usuario = ? OR email = ?) AND contrasena = ?";
    
    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, identificador);
        ps.setString(2, identificador);
        ps.setString(3, pass);
        
        try (ResultSet rs = ps.executeQuery()) {
            if (rs.next()) {
                req.session().attribute("user_id", rs.getInt("id"));
                req.session().attribute("user_nombre", rs.getString("usuario"));
                req.session().attribute("user_email", rs.getString("email"));
                req.session().attribute("user_telefono", rs.getString("telefono"));
                return "success";
            }
        }
    } catch (SQLException e) { e.printStackTrace(); }
    
    res.status(401);
    return "error";
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
        // --- RUTA PARA PROCESAR RESERVAS ---
        post("/reservar", (req, res) -> {
            try {
        Integer idCliente = req.session().attribute("user_id");
        String fecha = req.queryParams("fecha");
        String hora = req.queryParams("hora");
        String personasStr = req.queryParams("personas");
        String nombre = req.queryParams("nombre");
        String telefono = req.queryParams("telefono");
        String comentarios = req.queryParams("comentarios");

        // Depuración: Ver en consola qué llega del formulario
        System.out.println("Intento de reserva: " + nombre + " para el " + fecha);

        if (personasStr == null || personasStr.isEmpty()) {
            return "error";
        }

        int personas = Integer.parseInt(personasStr);
        boolean exito = registrarReserva(fecha, hora, personas, nombre, telefono, comentarios, idCliente);
        
        return exito ? "success" : "error";
    } catch (Exception e) {
        e.printStackTrace();
        return "error";
    }
});

        System.out.println("Servidor de Arima Taberna funcionando en http://localhost:4568");
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

    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
        conn.setAutoCommit(false); // Empezamos transacción para que se hagan las dos o ninguna

        try (PreparedStatement psUser = conn.prepareStatement(sqlUser, PreparedStatement.RETURN_GENERATED_KEYS)) {
            psUser.setString(1, usuario);
            psUser.setString(2, email);
            psUser.setString(3, contrasena);
            psUser.setString(4, telefono);
            psUser.setInt(5, tipo);
            psUser.executeUpdate();

            // Obtenemos el ID generado
            ResultSet rs = psUser.getGeneratedKeys();
            if (rs.next()) {
                int idGenerado = rs.getInt(1);

                // Si es un cliente, lo registramos en la tabla clientes
                if (tipo == 2) {
                    try (PreparedStatement psCli = conn.prepareStatement(sqlCliente)) {
                        psCli.setInt(1, idGenerado);
                        psCli.setString(2, usuario); // Usamos el nombre de usuario como nombre completo inicial
                        psCli.setString(3, telefono);
                        psCli.setString(4, email);
                        psCli.executeUpdate();
                    }
                }
            }
            conn.commit(); // Guardamos cambios
            return true;
        } catch (SQLException e) {
            conn.rollback(); // Si algo falla, deshacemos todo
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
    // Añadimos id_cliente a la inserción
    String sql = "INSERT INTO Arima_BD.reservas (fecha, hora, personas, nombre, telefono, comentarios, id_cliente, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pendiente')";
    try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
         PreparedStatement ps = conn.prepareStatement(sql)) {
        ps.setString(1, fecha);
        ps.setString(2, hora);
        ps.setInt(3, personas);
        ps.setString(4, nombre);
        ps.setString(5, telefono);
        ps.setString(6, comentarios);
        
        if (idCliente != null) ps.setInt(7, idCliente); 
        else ps.setNull(7, java.sql.Types.INTEGER);
        
        return ps.executeUpdate() > 0;
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