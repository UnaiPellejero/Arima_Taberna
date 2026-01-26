package app;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static spark.Spark.get;
import static spark.Spark.port;
import static spark.Spark.post;
import static spark.Spark.staticFiles;
public class App {
// Ajustar estos datos a tu BD
private static final String DB_URL =
"jdbc:mysql://34.230.190.133:3306/?user=Admin_Arima?useSSL=false&serverTimezone=UTC";
private static final String DB_USER = "Admin_Arima";
private static final String DB_PASS = "2025Nazaret2026";
public static void main(String[] args) {
port(4567);
// Sirve los HTML de src/main/resources/public
staticFiles.location("/public");
// Página inicial (opcional): redirige al login
get("/", (req, res) -> {
res.redirect("/login.html");
return null;
});
// Recibe el POST del formulario
post("/login", (req, res) -> {
String usuario = req.queryParams("usuario");
String contrasena = req.queryParams("contrasena");
Integer tipo = obtenerTipoSiCredencialesValidas(usuario,
contrasena);
if (tipo == null) {
res.status(401);
return "Credenciales incorrectas";
}
// Redirección según tipo
if (tipo == 1) {
//res.redirect("/web1.html");
//res.redirect("/web1");//java devuelve el html
res.redirect("/web1?usuario=" + usuario);
} else if (tipo == 2) {
res.redirect("/web2.html");
} else {
res.status(403);
return "Usuario válido, pero tipo no permitido: " +
tipo;
}
return null;
});

/*Si queremos enviar datos recogidos de la BD a los html, una manera
sencilla es generar el HTML como texto en java y devolverlo. No es lo
más recomendable, pero es lo que haremos por ahora.
En vez de redirect, devolver un String con HTML, y en el login, en vez
de res.redirect("/web1.html"), redirigir a "/web1". */
get("/web1", (req, res) -> {
// ejemplo: datos de la BD
//String nombre = "Admin";
String nombre = req.queryParams("usuario");
int puntos = 120;
res.type("text/html");
//en el formato de texto se pone %s(string), %d(números enteros),
//%f(float) para luego sustituirlos con .formatted (en el mismo orden)
return """
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Web 1</title></head>
<body>
<h1>Zona tipo 1</h1>
<p>Bienvenido, %s</p>
<p>Puntos: %d</p>
</body>
</html>
""".formatted(nombre, puntos);
});
}
/**
* Devuelve el tipo si existe un usuario con esas credenciales.
* Devuelve null si no existe.
*/
private static Integer obtenerTipoSiCredencialesValidas(String
usuario, String contrasena) {
String sql = "SELECT tipo FROM Arima_BD.usuarios WHERE usuario = ? AND contrasena = ?";
try (Connection conn = DriverManager.getConnection(DB_URL,
DB_USER, DB_PASS);
PreparedStatement ps = conn.prepareStatement(sql)) {
ps.setString(1, usuario);
ps.setString(2, contrasena);
try (ResultSet rs = ps.executeQuery()) {
if (rs.next()) {
return rs.getInt("tipo");
}
return null;
}
} catch (SQLException e) {
// Para clase: se imprime el error para depurar
e.printStackTrace();
return null;
}
}
}
//-> http://localhost:4567/ (redirige a login.html)