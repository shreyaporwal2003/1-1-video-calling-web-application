require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes.js");
const connectToMongoDB = require("./config/db.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // to parse the incoming requests with JSON payloads (from req.body)
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use("/api/auth", authRoutes);

const server = http.createServer(app);

const setupSocket = require("./socket/socket.handler.js");

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
