let io;

const initSocket = (server) => {
  const socketIO = require("socket.io");

  io = socketIO(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
logger.info("Client connected", { socketId: socket.id });
    socket.on("join-logs", (userId) => {
      socket.join("logs-room");
      logger.info(`User joined logs-room`, { userId });
    });

    socket.on("disconnect", () => {
logger.info("Client disconnected", { socketId: socket.id });
    });
  });
};


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