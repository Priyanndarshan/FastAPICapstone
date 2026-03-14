import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <div>
            <h1>Welcome, {user?.name}</h1>
            <p>{user?.email}</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}