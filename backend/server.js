// Load environment variables
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
   
// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO with CORS config
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

/*
  Socket.IO Signaling Server Responsibilities:
  - Manage room joining
  - Limit room to 2 users (1-to-1 call)
  - Relay WebRTC signaling messages (offer, answer, ICE)
  - Handle call end & disconnect cleanly
*/

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  /* --------------------------------------------------
     JOIN ROOM LOGIC (MOST IMPORTANT PART)
     -------------------------------------------------- */
  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClients = room ? room.size : 0;

    console.log(`📡 Room ${roomId} has ${numClients} user(s) before join`);

    // ❌ Prevent more than 2 users in a 1-to-1 call
    if (numClients >= 2) {
      socket.emit("room-full");
      return;
    }

    // Join the room
    socket.join(roomId);

    console.log(`➡️ ${socket.id} joined room ${roomId}`);

    // ✅ Notify first user ONLY when second user joins
    if (numClients === 1) {
      socket.to(roomId).emit("peer-joined");
      console.log("🤝 Peer joined event sent");
    }
  });

  /* --------------------------------------------------
     WEBRTC SIGNALING RELAY
     -------------------------------------------------- */

  // Forward offer to other peer
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", offer);
  });

  // Forward answer to other peer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", answer);
  });

  // Forward ICE candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  /* --------------------------------------------------
     CALL END HANDLING
     -------------------------------------------------- */

  socket.on("end-call", (roomId) => {
    socket.to(roomId).emit("call-ended");
    console.log(`📴 Call ended in room ${roomId}`);
  });

  /* --------------------------------------------------
     DISCONNECT HANDLING
     -------------------------------------------------- */

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    // Optional improvement:
    // could notify room peer here if tracking roomId per socket
  });
});

/* --------------------------------------------------
   START SERVER
   -------------------------------------------------- */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});