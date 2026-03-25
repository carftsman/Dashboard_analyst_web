const prisma = require('../prisma/prismaClient');

exports.getLogs = async (req, res) => {
  try {
    const user = req.user;

    //////////////////////////////////////////////////////
    // 🔒 ROLE CHECK
    //////////////////////////////////////////////////////
    if (!['ADMIN', 'ANALYST'].includes(user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ FETCH LOGS WITH USER EMAIL
    //////////////////////////////////////////////////////
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    //////////////////////////////////////////////////////
    // ✅ FORMAT RESPONSE
    //////////////////////////////////////////////////////
    const formatted = logs.map((log, index) => ({
      sNo: index + 1,
      user: log.user?.name || "Unknown",
      email: log.user?.email || "N/A",   // ✅ NEW FIELD
      action: log.action,
      description: log.metadata?.description || "",
      time: log.createdAt
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};