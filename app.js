const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { swaggerSetup } = require("./config/swagger");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

swaggerSetup(app);

// ✅ ROUTES (FIXED — NO CONFLICT)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboards", require("./routes/dashboardRoutes"));

// 🔥 IMPORTANT CHANGE HERE
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api", require("./routes/dashboardDataRoutes")); 
app.use("/api/widgets", require("./routes/widgetRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use('/api', require('./routes/logRoutes'));
app.get("/", (req, res) => {
  res.send("API running...");
});

module.exports = app;