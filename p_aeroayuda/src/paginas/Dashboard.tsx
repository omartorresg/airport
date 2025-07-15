import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css"; // Importa el CSS externo

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">🛫 Sistema Aeroportuario - Panel Principal</h1>

      <div className="dashboard-grid">
        <button className="dashboard-button" onClick={() => navigate('/quejas')}>
          📣 Gestión de Quejas
        </button>

        <button className="dashboard-button" onClick={() => navigate('/personal')}>
          👨‍✈️ Personal Operativo
        </button>

        <button className="dashboard-button" onClick={() => alert("En desarrollo")}>
          🚨 Emergencias
        </button>

        <button className="dashboard-button" onClick={() => alert("En desarrollo")}>
          📢 Notificaciones
        </button>

        <button className="dashboard-button" onClick={() => alert("En desarrollo")}>
          🗺️ Rutas de Evacuación
        </button>
      </div>
    </div>
  );
}
