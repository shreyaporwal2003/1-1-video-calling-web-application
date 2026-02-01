import { useState } from "react";
import PreJoin from "./components/PreJoin";
import Call from "./components/Call";

export default function App() {
  // Stores the current room ID
  const [roomId, setRoomId] = useState(null);

  // 🔹 CREATE A UNIQUE ROOM ID
  // This runs only when user clicks "Create Call"
  const createRoom = () => {
    const id = crypto.randomUUID(); // generates unique ID
    setRoomId(id);
  };

  // 🔹 JOIN AN EXISTING ROOM USING SHARED ID
  const joinRoom = (id) => {
    setRoomId(id);
  };

  return (
    <>
      {roomId ? (
        // If roomId exists → enter the call
        <Call
          roomId={roomId}
          onEnd={() => setRoomId(null)}
        />
      ) : (
        // Otherwise → show pre-join screen
        <PreJoin
          onCreate={createRoom}
          onJoin={joinRoom}
        />
      )}
    </>
  );
}
