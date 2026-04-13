const prisma = require('../prisma/prismaClient');
const { getIO } = require("../socket");
const activityLogger = async (req, res, next) => {
  const oldSend = res.send;

  res.send = async function (data) {
    try {


      //////////////////////////////////////////////////////
      // ✅ LOG ONLY VALID REQUESTS
      //////////////////////////////////////////////////////
      if (res.statusCode < 400 && req.user) {

        let action = req.method + " " + req.originalUrl;

        //////////////////////////////////////////////////////
        // 🔥 CUSTOM ACTIONS
        //////////////////////////////////////////////////////
        if (req.originalUrl.includes("login")) {
          action = "LOGIN";
        }
        else if (req.originalUrl.includes("/upload/upload")) {
          action = "UPLOAD_FILE";
        }
        else if (req.originalUrl.includes("reports/dashboard/pdf")) {
          action = "DOWNLOAD_REPORT";
        }
        else if (req.originalUrl.includes("widgets")) {
          action = "CUSTOMIZE_WIDGET";
        }

    const savedLog = await prisma.activityLog.create({
  data: {
    userId: req.user.id,
    action,
    metadata: {
      description: `${req.method} ${req.originalUrl}`,

      dashboardId:
        req.body?.dashboardId ||
        req.params?.dashboardId ||
        req.query?.dashboardId ||
        null,

      dashboardName: req.body?.dashboardName || null,

      reportId: req.body?.reportId || req.params?.reportId || null,
      reportName:
        req.body?.reportName ||
        req.body?.name ||
        null,

      widgetId: req.params?.widgetId || null,

      fileId: req.body?.fileId || null,
      fileName: req.body?.fileName || req.file?.originalname || null,

      targetUserName:
  req.body?.targetUserName ||   // ✅ ADD THIS FIRST
  req.body?.name ||
  req.body?.username ||
  req.body?.email ||
  null,

      oldValue: req.body?.oldValue || null,
      newValue: req.body?.newValue || null,

      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.headers["user-agent"]
    }
  },
  include: {
    user: {
      select: {
        name: true,
        email: true
      }
    }
  }
});
// 🔥 REAL-TIME EMIT
try {
  const { emitNewLog } = require("../socket");

emitNewLog({
  user: savedLog.user.name,
  email: savedLog.user.email,
  action: savedLog.action,
  description: savedLog.metadata.description,
  time: savedLog.createdAt
});

} catch (e) {
  console.log("Socket not initialized yet");
}
      }
    } catch (err) {
      console.error("Logging failed:", err.message);
    }

    return oldSend.call(this, data); // ✅ ALWAYS RETURN
  };

  next();
};

module.exports = activityLogger;