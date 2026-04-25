require("dotenv").config(); // ✅ MUST be first line
const logger = require("./utils/logger"); 

const http = require("http");
const app = require("./app");

const cron = require("node-cron");
const deleteOldReports = require("./jobs/deleteOldReports");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);


server.listen(PORT, () => {
logger.info("Server started", {
  port: PORT,
  env: process.env.NODE_ENV
});
  cron.schedule("0 2 * * *", async () => {
logger.info("Running report cleanup");

    try {
      await deleteOldReports();
logger.info("Report cleanup completed");

} catch (err) {
logger.error("Cron job failed", {
  error: err.message,
  stack: err.stack
});
    }
  });
});

// ✅ error handling
server.on("error", (err) => {
logger.error("Server error", { error: err.message, stack: err.stack });
});