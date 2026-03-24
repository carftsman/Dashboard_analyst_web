const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ error handling
server.on("error", (err) => {
  console.error("Server error:", err);
});