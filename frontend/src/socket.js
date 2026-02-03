import { io } from "socket.io-client";

// Current laptop IP (for localhost + phone testing)
const socket = io("http://10.108.143.140:5000", {
  transports: ["websocket"],
  reconnectionAttempts: 5
});

export default socket;
