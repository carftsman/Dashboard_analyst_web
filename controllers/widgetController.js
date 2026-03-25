const prisma = require('../prisma/prismaClient');

exports.getWidgets = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    if (isNaN(dashboardId)) {
      return res.status(400).json({ message: "Invalid dashboardId" });
    }

    //////////////////////////////////////////////////////
    // ✅ CHECK USER CUSTOM WIDGETS FIRST
    //////////////////////////////////////////////////////
    const userWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        createdById: req.user.id,
        isDefault: false
      },
      orderBy: { id: "asc" }
    });

    //////////////////////////////////////////////////////
    // ✅ FALLBACK TO ADMIN DEFAULT
    //////////////////////////////////////////////////////
    const widgets = userWidgets.length > 0
      ? userWidgets
      : await prisma.widget.findMany({
          where: {
            dashboardId,
            isDefault: true
          },
          orderBy: { id: "asc" }
        });

    res.json({
      dashboardId,
      isCustom: userWidgets.length > 0, // 🔥 IMPORTANT
      widgets
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.saveUserWidget = async (req, res) => {
  try {
    const { dashboardId, name, type, config, replaceWidgetId } = req.body;

    if (!dashboardId || !type) {
      return res.status(400).json({ message: "dashboardId & type required" });
    }

    const normalizedType = type.toUpperCase();

    //////////////////////////////////////////////////////
    // ✅ IF REPLACE MODE
    //////////////////////////////////////////////////////
    if (replaceWidgetId) {
      const widget = await prisma.widget.update({
        where: { id: Number(replaceWidgetId) },
        data: {
          name,
          type: normalizedType,
          config,
          createdById: req.user.id,
          isDefault: false
        }
      });

      return res.json({
        message: "Widget replaced successfully",
        widget
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CREATE NEW CUSTOM WIDGET
    //////////////////////////////////////////////////////
    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        name,
        type: normalizedType,
        config,
        createdById: req.user.id,
        isDefault: false
      }
    });

    res.json({
      message: "Custom chart saved",
      widget
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};