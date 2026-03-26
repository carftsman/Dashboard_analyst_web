const prisma = require('../prisma/prismaClient');

exports.getWidgets = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    if (isNaN(dashboardId)) {
      return res.status(400).json({ message: "Invalid dashboardId" });
    }

    //////////////////////////////////////////////////////
    // DEFAULT + USER OVERRIDES
    //////////////////////////////////////////////////////
    const defaultWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        isDefault: true
      },
      orderBy: { id: "asc" }
    });

    const userWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        createdById: req.user.id,
        isDefault: false
      }
    });

    //////////////////////////////////////////////////////
    // 🔥 MERGE LOGIC (NO DUPLICATES)
    //////////////////////////////////////////////////////
    const merged = defaultWidgets.map(def => {
      const override = userWidgets.find(
        uw => uw.originalWidgetId === def.id
      );

      return override || def;
    });

    //////////////////////////////////////////////////////
    // ADD EXTRA USER WIDGETS (NEW ONES)
    //////////////////////////////////////////////////////
    const extraWidgets = userWidgets.filter(
      uw => !uw.originalWidgetId
    );

    res.json({
      dashboardId,
      isCustom: userWidgets.length > 0,
      widgets: [...merged, ...extraWidgets]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.saveUserWidget = async (req, res) => {
  try {
    let { dashboardId, name, type, config, replaceWidgetId } = req.body;

    dashboardId = Number(dashboardId);

    if (!dashboardId || isNaN(dashboardId) || !type) {
      return res.status(400).json({
        message: "Valid dashboardId & type required"
      });
    }

    const normalizedType = type.toUpperCase();

    //////////////////////////////////////////////////////
    // ✅ REPLACE MODE (BEST PRACTICE)
    //////////////////////////////////////////////////////
    if (replaceWidgetId) {
      const defaultWidget = await prisma.widget.findUnique({
        where: { id: Number(replaceWidgetId) }
      });

      if (!defaultWidget) {
        return res.status(404).json({ message: "Widget not found" });
      }

      //////////////////////////////////////////////////////
      // 🔥 DELETE OLD USER CUSTOM FOR SAME DEFAULT
      //////////////////////////////////////////////////////
      await prisma.widget.deleteMany({
        where: {
          dashboardId,
          createdById: req.user.id,
          originalWidgetId: Number(replaceWidgetId)
        }
      });

      //////////////////////////////////////////////////////
      // 🔥 CREATE NEW (CLONE + OVERRIDE)
      //////////////////////////////////////////////////////
      const widget = await prisma.widget.create({
        data: {
          dashboardId,
          name: name || defaultWidget.name,
          type: normalizedType,
          config,
          position: defaultWidget.position,
          createdById: req.user.id,
          isDefault: false,
          originalWidgetId: defaultWidget.id // 🔥 IMPORTANT
        }
      });

      return res.json({
        message: "Widget replaced successfully",
        widget
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CREATE NEW (NO DUPLICATES)
    //////////////////////////////////////////////////////
    await prisma.widget.deleteMany({
      where: {
        dashboardId,
        createdById: req.user.id,
        name
      }
    });

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