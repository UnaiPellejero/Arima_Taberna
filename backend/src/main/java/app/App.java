package app;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static spark.Spark.*;

public class App {
    private static final String DB_URL = "jdbc:mysql://34.230.190.133:3306/Arima_BD?useSSL=false&serverTimezone=UTC";
    private static final String DB_USER = "Admin_Arima";
    private static final String DB_PASS = "2025Nazaret2026";

    public static void main(String[] args) {
        port(4568); 

        // Configuración de archivos estáticos
        staticFiles.location("public/frontend");
        
        get("/", (req, res) -> {
            res.redirect("/index.html");
            return null;
        });

        // Ruta de Login (Sin cambios)
        post("/login-auth", (req, res) -> {
            String identificador = req.queryParams("email");
            String pass = req.queryParams("password");
            
            Integer tipo = obtenerTipoSiCredencialesValidas(identificador, pass);

            if (tipo == null) {
                res.status(401);
                return "error";
            }
            req.session().attribute("usuario", identificador);
            return "success";
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

        System.out.println("¡Servidor de Arima Taberna funcionando en http://localhost:4568!");
    }

    // --- MÉTODOS SQL ---

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
    }

    // --- MÉTODO REGISTRAR ACTUALIZADO ---
    private static boolean registrarUsuario(String usuario, String email, String contrasena, String telefono, int tipo) {
        // Añadimos 'telefono' a la consulta SQL
        String sql = "INSERT INTO Arima_BD.usuarios (usuario, email, contrasena, telefono, tipo) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, usuario);
            ps.setString(2, email);
            ps.setString(3, contrasena);
            ps.setString(4, telefono); 
            ps.setInt(5, tipo);
            return ps.executeUpdate() > 0;
        } catch (SQLException e) { 
            System.err.println("Error al registrar: " + e.getMessage());
            return false; 
        }
    }
}