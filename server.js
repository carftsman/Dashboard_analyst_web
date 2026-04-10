const dotenv = require("dotenv");
dotenv.config();

const http = require("http");
const app = require("./app");

const cron = require("node-cron");
const deleteOldReports = require("./jobs/deleteOldReports");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  ////////////////////////////////////////////////////////
  // 🕒 AUTO DELETE REPORTS (DAILY 2 AM)
  ////////////////////////////////////////////////////////
  cron.schedule("0 2 * * *", () => {
    console.log("⏰ Running report cleanup...");
    deleteOldReports();
  });
});

// ✅ error handling
server.on("error", (err) => {
  console.error("Server error:", err);
});