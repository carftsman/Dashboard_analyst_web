const dotenv = require("dotenv");
dotenv.config();


const http = require("http");

const app = require("./app");

//connectDB();

// Create HTTP server
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("PostgreSQL connected");
});