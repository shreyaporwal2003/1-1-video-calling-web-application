import { io } from "socket.io-client";

// Use your laptop's local IP
const socket = io("http://192.168.1.36:5000");

export default socket;
