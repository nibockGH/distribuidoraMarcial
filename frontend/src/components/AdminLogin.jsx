import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate                 = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "distribuidoramarcial" && password === "escaparate22") {
      // Guardamos la sesión de admin
      localStorage.setItem("isAdmin", "true");
      // Redirigimos al panel de administración
      navigate("/admin");
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Ingreso administrador</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
}
