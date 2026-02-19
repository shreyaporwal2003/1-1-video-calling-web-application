const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("✅ Connected:", socket.id);

        // 🔹 JOIN ROOM WITH NAME
        socket.on("join-room", ({ roomId, name }) => {
            if (!roomId || !name) return;

            const room = io.sockets.adapter.rooms.get(roomId);
            const numClients = room ? room.size : 0;

            if (numClients >= 2) {
                socket.emit("room-full");
                return;
            }

            socket.join(roomId);

            // store metadata
            socket.data.roomId = roomId;
            socket.data.name = name;

            // notify other peer
            socket.to(roomId).emit("peer-joined", { name });
        });

        socket.on("offer", ({ roomId, offer }) => {
            socket.to(roomId).emit("offer", offer);
        });

        socket.on("answer", ({ roomId, answer }) => {
            socket.to(roomId).emit("answer", answer);
        });

        socket.on("ice-candidate", ({ roomId, candidate }) => {
            socket.to(roomId).emit("ice-candidate", { candidate });
        });

        // 🔹 CHAT MESSAGES
        socket.on("send-message", ({ roomId, message, senderName }) => {
            // Broadcast to everyone in the room INCLUDING sender (or just others, depending on UI needs)
            // But usually we append local message immediately in UI, so sending to others is enough.
            // Let's send to others:
            socket.to(roomId).emit("receive-message", { message, senderName });
        });

        // 🔹 REAL MANUAL END ONLY
        socket.on("end-call", (roomId) => {
            socket.to(roomId).emit("call-ended");
        });

        // 🔹 DISCONNECT HANDLING
        socket.on("disconnect", () => {
            const roomId = socket.data.roomId;

            if (!roomId) return;

            // emit peer-left instead of call-ended
            socket.to(roomId).emit("peer-left");
        });
    });
};

module.exports = setupSocket;
