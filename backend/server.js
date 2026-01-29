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

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("join-room", roomId => {
    socket.join(roomId);
    socket.to(roomId).emit("peer-joined");
  });

  socket.on("offer", data => {
    socket.to(data.roomId).emit("offer", data.offer);
  });

  socket.on("answer", data => {
    socket.to(data.roomId).emit("answer", data.answer);
  });

  socket.on("ice-candidate", data => {
    socket.to(data.roomId).emit("ice-candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("peer-left");
  });

  // When a user ends the call
  socket.on("end-call", (roomId) => {
    socket.to(roomId).emit("call-ended");
  });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

