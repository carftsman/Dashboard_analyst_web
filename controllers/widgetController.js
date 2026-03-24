const prisma = require('../prisma/prismaClient');

exports.getWidgets = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const id = Number(dashboardId);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid dashboardId" });
    }

    const widgets = await prisma.widget.findMany({
      where: { dashboardId: id },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        config: true,
        position: true
      }
    });

    res.json({
      dashboardId: id,
      widgets
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.saveUserWidget = async (req, res) => {
  try {
    const { dashboardId, name, type, config } = req.body;

    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        name,
        type,
        config,
        createdById: req.user.id, // 👈 IMPORTANT
        isDefault: false
      }
    });

    res.json({ message: "Custom chart saved", widget });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};