import { useState } from "react";
import PreJoin from "../components/PreJoin";
import Call from "../components/Call";
import useLogout from "../hooks/useLogout";
import { useAuthContext } from "../context/AuthContext";

const Home = () => {
    const [session, setSession] = useState(null);
    const { loading, logout } = useLogout();
    const { authUser } = useAuthContext();

    const createRoom = (name) => {
        const id = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSession({ roomId: id, name });
    };

    const joinRoom = ({ roomId, name }) => {
        setSession({ roomId, name });
    };

    return (
        <div style={{ width: "100%", height: "100%" }}>
            {!session && (
                <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {authUser && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white" }}>
                            <img 
                                src={authUser.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                alt={authUser.fullName} 
                                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#ccc" }}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
                            />
                            <span style={{ fontWeight: "bold" }}>{authUser.fullName}</span>
                        </div>
                    )}
                    <button onClick={logout} className="join-btn" style={{ width: "auto", padding: "8px 16px", backgroundColor: "#ea4335" }}>
                        {loading ? "..." : "Logout"}
                    </button>
                </div>
            )}
            {session ? (
                <Call {...session} onEnd={() => setSession(null)} />
            ) : (
                <PreJoin onCreate={createRoom} onJoin={joinRoom} />
            )}
        </div>
    );
};

export default Home;
