const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

console.log("🔥 Starting server...");

try {
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

} catch (error) {
  console.error("❌ Server failed:", error);
}