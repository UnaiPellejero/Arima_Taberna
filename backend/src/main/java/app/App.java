package app;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.Properties;
import java.io.FileInputStream;
import static spark.Spark.*;

public class App {
    private static String DB_URL;
    private static String DB_USER;
    private static String DB_PASS;

    public static void main(String[] args) {
        cargarConfiguracion();

        // CONFIGURACIÓN DE ARCHIVOS ESTÁTICOS
        staticFiles.location("/public/frontend");
        port(4568);

        // --- RUTA PRINCIPAL CON INYECCIÓN DE DATOS (SSR) ---
        get("/", (req, res) -> {
            res.type("text/html; charset=utf-8");
            
            String html = "";
            try (InputStream is = App.class.getResourceAsStream("/public/frontend/index.html")) {
                if (is == null) return "Error: No se encontró index.html en /public/frontend/";
                html = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            } catch (Exception e) {
                return "Error al cargar el archivo: " + e.getMessage();
            }

            // Sacamos datos de la sesión
            String nombre = req.session().attribute("user_nombre");
            String telefono = req.session().attribute("user_telefono");

            if (nombre != null) {
                // Inyectamos los valores en los inputs de la reserva
                html = html.replace("id=\"nombre\" name=\"nombre\"", "id=\"nombre\" name=\"nombre\" value=\"" + nombre + "\"");
                html = html.replace("id=\"telefono\" name=\"telefono\"", "id=\"telefono\" name=\"telefono\" value=\"" + telefono + "\"");
                
                // Cambiamos el texto del botón de login por el nombre del usuario
                html = html.replace("Login", "Hola, " + nombre.split(" ")[0]); 
            }

            return html;
        });

        // --- LOGIN ---
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
                        req.session().attribute("user_email", rs.getString("email"));
                        req.session().attribute("user_telefono", rs.getString("telefono"));
                        return String.valueOf(tipo);
                    }
                }
            } catch (SQLException e) { e.printStackTrace(); }
            res.status(401);
            return "error";
        });
        //Loguin
       get("/get-session-user", (req, res) -> {
    res.type("application/json");
    res.header("Content-Encoding", "UTF-8");
    
    String nombre = req.session().attribute("user_nombre");
    String email = req.session().attribute("user_email");
    String telefono = req.session().attribute("user_telefono");

    if (nombre != null) {
        return String.format(
            "{\"logged\": true, \"nombre\": \"%s\", \"email\": \"%s\", \"telefono\": \"%s\"}",
            nombre, email, telefono
        );
    } else {
        return "{\"logged\": false}";
    }
});
        // --- PANEL DE ADMINISTRACIÓN ---
        get("/admin", (req, res) -> {
        res.type("text/html; charset=utf-8");
        String html = "";
        try (InputStream is = App.class.getResourceAsStream("/public/frontend/admin.html")) {
            html = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
        
        StringBuilder filas = new StringBuilder();
        String sql = "SELECT r.*, u.email FROM Arima_BD.reservas r LEFT JOIN Arima_BD.usuarios u ON r.id_cliente = u.id";
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
            Statement st = conn.createStatement();
            ResultSet rs = st.executeQuery(sql)) {
            
            while (rs.next()) {
                int id = rs.getInt("id");
                String nombre = rs.getString("nombre");
                String email = rs.getString("email") != null ? rs.getString("email") : "Sin registro";
                String tel = rs.getString("telefono");
                String comentarios = rs.getString("comentarios") != null ? rs.getString("comentarios") : "";
                int pax = rs.getInt("personas");

                filas.append("<tr>")
                    .append("<td>").append(id).append("</td>")
                    .append("<td>").append(nombre).append("</td>")
                    .append("<td>").append(email).append("</td>")
                    .append("<td>").append(tel).append("</td>")
                    .append("<td>").append(rs.getString("fecha")).append(" ").append(rs.getString("hora")).append("</td>")
                    .append("<td>").append(pax).append("</td>")
                    .append("<td>").append(comentarios).append("</td>")
                    .append("<td><span class='status'>").append(rs.getString("estado")).append("</span></td>")
                    .append("<td>").append(rs.getInt("id_mesa")).append("</td>")
                    .append("<td>")
                    // El botón ahora llama a abrirModal con todos los datos
                    .append(String.format("<button data-i18n='panel.editar' class='btn-edit' onclick=\"abrirModal(%d, '%s', '%s', '%s', %d, '%s')\">Editar</button>", 
                            id, nombre, tel, comentarios, pax, email))
                    .append("</td>")
                    .append("</tr>");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        
        return html.replace("Hola", filas.toString());
    });
    post("/admin/actualizar", (req, res) -> {
        String id = req.queryParams("id");
        String nombre = req.queryParams("nombre");
        String tel = req.queryParams("telefono");
        String pax = req.queryParams("pax");
        String comentarios = req.queryParams("comentarios");

        String sql = "UPDATE Arima_BD.reservas SET nombre = ?, telefono = ?, personas = ?, comentarios = ? WHERE id = ?";
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, nombre);
            ps.setString(2, tel);
            ps.setInt(3, Integer.parseInt(pax));
            ps.setString(4, comentarios);
            ps.setInt(5, Integer.parseInt(id));
            ps.executeUpdate();
        } catch (Exception e) { e.printStackTrace(); }
        
        res.redirect("/admin"); // Recarga el panel para ver los cambios
        return null;
    });

        // --- REGISTRO ---
        post("/registro", (req, res) -> {
            boolean exito = registrarUsuario(req.queryParams("usuario"), req.queryParams("email"), 
                                            req.queryParams("password"), req.queryParams("telefono"), 2);
            return exito ? "success" : "error";
        });

        // --- RESERVAR ---
        post("/reservar", (req, res) -> {
            try {
                boolean exito = registrarReserva(req.queryParams("fecha"), req.queryParams("hora"), 
                                               Integer.parseInt(req.queryParams("personas")), req.queryParams("nombre"), 
                                               req.queryParams("telefono"), req.queryParams("comentarios"), 
                                               req.session().attribute("user_id"));
                return exito ? "success" : "error";
            } catch (Exception e) { return "error"; }
        });

        System.out.println("Servidor iniciado: http://localhost:4568");
    }

    private static void cargarConfiguracion() {
        Properties prop = new Properties();
        try (FileInputStream fis = new FileInputStream("config.properties")) {
            prop.load(fis);
            DB_URL = prop.getProperty("db.url");
            DB_USER = prop.getProperty("db.user");
            DB_PASS = prop.getProperty("db.pass");
        } catch (Exception e) { System.err.println("Error config.properties"); }
    }

    private static boolean registrarUsuario(String usuario, String email, String contrasena, String telefono, int tipo) {
        String sql = "INSERT INTO Arima_BD.usuarios (usuario, email, contrasena, telefono, tipo) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, usuario); ps.setString(2, email); ps.setString(3, contrasena); ps.setString(4, telefono); ps.setInt(5, tipo);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { return false; }
    }

    private static boolean registrarReserva(String fecha, String hora, int personas, String nombre, String telefono, String comentarios, Integer idCliente) {
        String sql = "INSERT INTO Arima_BD.reservas (fecha, hora, personas, nombre, telefono, comentarios, id_cliente, id_mesa, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS)) {
            Integer mesa = buscarMesaDisponible(conn, fecha, hora, personas);
            if (mesa == null) return false;
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, fecha); ps.setString(2, hora); ps.setInt(3, personas);
                ps.setString(4, nombre); ps.setString(5, telefono); ps.setString(6, comentarios);
                if (idCliente != null) ps.setInt(7, idCliente); else ps.setNull(7, Types.INTEGER);
                ps.setInt(8, mesa);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) { return false; }
    }

    private static Integer buscarMesaDisponible(Connection conn, String fecha, String hora, int personas) throws SQLException {
        String sql = "SELECT id_mesa FROM Arima_BD.mesas WHERE cantidad_personas >= ? AND id_mesa NOT IN " +
                     "(SELECT id_mesa FROM Arima_BD.reservas WHERE fecha = ? AND ABS(TIMEDIFF(hora, ?)) < '01:30:00') " +
                     "ORDER BY cantidad_personas ASC LIMIT 1";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, personas); ps.setString(2, fecha); ps.setString(3, hora);
            try (ResultSet rs = ps.executeQuery()) { if (rs.next()) return rs.getInt("id_mesa"); }
        }
        return null;
    }
}