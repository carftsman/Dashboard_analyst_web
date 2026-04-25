const prisma = require("../prisma/prismaClient");
exports.uploadFrontendPDF = async (req, res) => {
  try {
    const { name, dashboardId, fileId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF file required" });
    }

    const fileName = `report-${Date.now()}.pdf`;

    const fileUrl = await azureService.uploadFile(
      req.file.buffer,
      fileName
    );

    const report = await prisma.report.create({
      data: {
        name: name || "Dashboard Report",
        dashboardId: Number(dashboardId),
        fileId,
        generatedBy: req.user.id,
        fileUrl,
        config: [],      // optional
        snapshot: []     // optional
      }
    });

    res.json({
      message: "Frontend PDF uploaded successfully",
      fileUrl,
      report
    });

  } catch (err) {
    logger.error("Upload frontend PDF failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({ error: err.message });
  }
};


exports.getAllReports = async (req, res) => {
  try {
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
const skip = (page - 1) * limit;

const reports = await prisma.report.findMany({
  skip,
  take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        dashboard: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formatted = reports.map((r, index) => ({
      sNo: skip + index + 1,
      reportId: r.id,
      reportName: r.name,
      dashboardName: r.dashboard?.name || "N/A",
      userName: r.user?.name || "Unknown",
      email: r.user?.email || "N/A",
      fileUrl: r.fileUrl,
      generatedAt: r.createdAt
    }));

const total = await prisma.report.count();


res.json({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit), // 🔥 add this
  data: formatted
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getMyReports = async (req, res) => {
  try {
    const { dashboardId } = req.query;

    if (!dashboardId) {
      return res.status(400).json({
        message: "dashboardId is required"
      });
    }

    //////////////////////////////////////////////////////
    // 🔥 ONLY FILTER BY DASHBOARD (NOT USER)
    //////////////////////////////////////////////////////
    const reports = await prisma.report.findMany({
      where: {
        dashboardId: Number(dashboardId)
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        fileUrl: true,
        dashboardId: true,
        fileId: true,
        generatedBy: true
      }
    });

    res.json(reports);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getReport = async (req, res) => {
  try {
    const reportId = req.params.reportId; // ✅ KEEP AS STRING

    const report = await prisma.report.findUnique({
      where: { id: reportId },   // ✅ FIXED
      include: {
        dashboard: {
          select: { name: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found"
      });
    }

    res.locals.reportName = report.name;
    res.locals.dashboardName = report.dashboard?.name;

    res.json(report);

  } catch (err) {
logger.error("Get report failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({ error: err.message });
  }
};
exports.deleteReport = async (req, res) => {
  try {
const reportId = req.params.reportId;  
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        dashboard: {
          select: { name: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        message: "Report not found or already deleted"
      });
    }

res.locals.reportName = report.name;
res.locals.dashboardName = report.dashboard?.name;

 await prisma.report.delete({
  where: { id: reportId }
});

    res.json({
      message: "Report deleted successfully"
    });

  } catch (err) {
logger.error("Delete report failed", {
  error: err.message,
  stack: err.stack
});
    res.status(500).json({
      error: err.message
    });
  }
};
exports.saveReport = async (req, res) => {
  try {
    const { name, dashboardId, fileId, widgets } = req.body;
if (!dashboardId) {
  return res.status(400).json({ message: "dashboardId is required" });
}
    const report = await prisma.report.create({
      data: {
        dashboardId: Number(dashboardId),
        fileId,
        generatedBy: req.user.id, // ✅ FIXED
        config: widgets,
        snapshot: {}
      }
    });

    res.json({
      message: "Report saved",
      reportId: report.id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};