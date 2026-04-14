let io;

const initSocket = (server) => {
  const socketIO = require("socket.io");

  io = socketIO(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("🔥 Client connected:", socket.id);

    //////////////////////////////////////////////////////
    // ✅ JOIN ROOM (IMPORTANT)
    //////////////////////////////////////////////////////
    socket.on("join-logs", (userId) => {
      socket.join("logs-room");
      console.log(`📡 User ${userId} joined logs-room`);
    });

    //////////////////////////////////////////////////////
    // ✅ DISCONNECT
    //////////////////////////////////////////////////////
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
};

//////////////////////////////////////////////////////
// 🔥 EMIT FUNCTION (BEST PRACTICE)
//////////////////////////////////////////////////////
const emitNewLog = (log) => {
  if (!io) return;

  io.to("logs-room").emit("new-log", log);
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }
  return io;
};

module.exports = { initSocket, getIO, emitNewLog };