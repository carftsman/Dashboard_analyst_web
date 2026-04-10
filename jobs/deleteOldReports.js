const prisma = require("../prisma/prismaClient");
const azureService = require("../services/azureService");

const deleteOldReports = async () => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    ////////////////////////////////////////////////////////
    // 🔥 FIND OLD REPORTS
    ////////////////////////////////////////////////////////
    const oldReports = await prisma.report.findMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo
        }
      }
    });

    console.log(`🧹 Found ${oldReports.length} old reports`);

    ////////////////////////////////////////////////////////
    // 🔥 DELETE FILES (OPTIONAL - Azure)
    ////////////////////////////////////////////////////////
    for (const report of oldReports) {
      try {
        if (report.fileUrl) {
          await azureService.deleteFile(report.fileUrl); // optional
        }
      } catch (err) {
        console.log("Azure delete failed:", err.message);
      }
    }

    ////////////////////////////////////////////////////////
    // 🔥 DELETE FROM DB
    ////////////////////////////////////////////////////////
    await prisma.report.deleteMany({
      where: {
        createdAt: {
          lt: threeMonthsAgo
        }
      }
    });

    console.log("✅ Old reports deleted successfully");

  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
  }
};

module.exports = deleteOldReports;