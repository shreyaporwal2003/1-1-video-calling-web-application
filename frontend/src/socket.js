import { io } from "socket.io-client";

// Use backend URL from Vite environment variable
const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"],
  withCredentials: true
});

export default socket;

// import { io } from "socket.io-client";

// // LOCAL backend URL
// const socket = io("http://localhost:5000", {
//   transports: ["websocket"], // faster + avoids polling issues
//   withCredentials: true,
// });

// export default socket;