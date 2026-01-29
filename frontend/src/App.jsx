import { useState } from "react";
import PreJoin from "./components/PreJoin";
import Call from "./components/Call";

export default function App() {
  const [roomId, setRoomId] = useState(null);

  return roomId ? (
    <Call roomId={roomId} onEnd={() => setRoomId(null)} />
  ) : (
    <PreJoin onJoin={setRoomId} />
  );
}
