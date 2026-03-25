const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { swaggerSetup } = require("./config/swagger");
const { verifyToken } = require("./middleware/authMiddleware");
const activityLogger = require("./middleware/activityLogger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

swaggerSetup(app);

//////////////////////////////////////////////////////
// 🔓 PUBLIC ROUTES (NO LOGGING)
//////////////////////////////////////////////////////
app.use("/api/auth", require("./routes/authRoutes"));

//////////////////////////////////////////////////////
// 🔐 PROTECTED ROUTES (WITH LOGGING)
//////////////////////////////////////////////////////
app.use(verifyToken);      // ✅ user added
app.use(activityLogger);   // ✅ now logging works

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboards", require("./routes/dashboardRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api", require("./routes/dashboardDataRoutes"));
app.use("/api/widgets", require("./routes/widgetRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api", require("./routes/logRoutes"));

//////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("API running...");
});

module.exports = app;