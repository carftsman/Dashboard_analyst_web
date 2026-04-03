const prisma = require('../prisma/prismaClient');

exports.getWidgets = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    if (isNaN(dashboardId)) {
      return res.status(400).json({ message: "Invalid dashboardId" });
    }

    const defaultWidgets = await prisma.widget.findMany({
      where: { dashboardId, isDefault: true },
      orderBy: { id: "asc" }
    });

    const userWidgets = await prisma.widget.findMany({
      where: {
        dashboardId,
        createdById: req.user.id,
        isDefault: false
      }
    });

    const merged = defaultWidgets.map(def => {
      const override = userWidgets.find(
        uw => uw.originalWidgetId === def.id
      );
      return override || def;
    });

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
    let { dashboardId, name, type, config, replaceWidgetId,fileId } = req.body;

    dashboardId = Number(dashboardId);

    if (!dashboardId || isNaN(dashboardId) || !type) {
      return res.status(400).json({
        message: "Valid dashboardId & type required"
      });
    }

    //////////////////////////////////////////////////////
    // ✅ FIX: NORMALIZE CONFIG
    //////////////////////////////////////////////////////
    const normalizeConfig = (config = {}) => {
      return {
        groupBy: config.groupBy || config.xAxis?.[0] || config.xAxis,
        metrics: config.metrics || config.yAxis || [],
        xAxis: config.xAxis || null,
        yAxis: config.yAxis || null,
        steps: config.steps || []
      };
    };

    const normalizedType = type?.toUpperCase();

    if (!normalizedType) {
      return res.status(400).json({ message: "Invalid type" });
    }

    //////////////////////////////////////////////////////
    // ✅ REPLACE MODE
    //////////////////////////////////////////////////////
    if (replaceWidgetId) {
      const defaultWidget = await prisma.widget.findUnique({
        where: { id: Number(replaceWidgetId) }
      });

      if (!defaultWidget) {
        return res.status(404).json({ message: "Widget not found" });
      }

      await prisma.widget.deleteMany({
        where: {
          dashboardId,
          createdById: req.user.id,
          originalWidgetId: Number(replaceWidgetId)
        }
      });
if (!fileId) {
  return res.status(400).json({
    message: "fileId required for custom widget"
  });
}
      const widget = await prisma.widget.create({
  data: {
    dashboardId,
    name,
    type,
    config,
    createdById: req.user.id,
    originalWidgetId: replaceWidgetId,
    isDefault: false,
    fileId: fileId   // ✅🔥 CRITICAL FIX
  }
});

      return res.json({
        message: "Widget replaced successfully",
        widget
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CREATE NEW
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
        config: normalizeConfig(config), // ✅ FIXED
        createdById: req.user.id,
        originalWidgetId,
        fileId,
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
exports.updateWidget = async (req, res) => {
  try {
    const widgetId = Number(req.params.widgetId);
    const { name, type, config } = req.body;

    //////////////////////////////////////////////////////
    // 🔍 GET ORIGINAL WIDGET
    //////////////////////////////////////////////////////
    const original = await prisma.widget.findUnique({
      where: { id: widgetId }
    });

    if (!original) {
      return res.status(404).json({ message: "Widget not found" });
    }

    //////////////////////////////////////////////////////
    // 🔧 NORMALIZE CONFIG (VERY IMPORTANT)
    //////////////////////////////////////////////////////
    const normalizeConfig = (config = {}) => ({
      groupBy: config.groupBy || config.xAxis?.[0],
      metrics: config.metrics || config.yAxis || [],
      xAxis: config.xAxis || [],
      yAxis: config.yAxis || [],
      steps: config.steps || []
    });

    //////////////////////////////////////////////////////
    // ✅ CASE 1: USER OWN WIDGET → UPDATE DIRECTLY
    //////////////////////////////////////////////////////
    if (!original.isDefault && original.createdById === req.user.id) {
      const updated = await prisma.widget.update({
        where: { id: widgetId },
        data: {
          name,
          type: type.toUpperCase(),
          config: normalizeConfig(config)
        }
      });

      return res.json({
        message: "Widget updated successfully",
        widget: updated
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CASE 2: ADMIN WIDGET → CREATE OVERRIDE
    //////////////////////////////////////////////////////

    // delete old override (if exists)
    await prisma.widget.deleteMany({
      where: {
        originalWidgetId: widgetId,
        createdById: req.user.id
      }
    });

    const newWidget = await prisma.widget.create({
      data: {
        dashboardId: original.dashboardId,
        name: name || original.name,
        type: type.toUpperCase(),
        config: normalizeConfig(config),
        position: original.position,
        createdById: req.user.id,
        isDefault: false,
        originalWidgetId: original.id
      }
    });

    res.json({
      message: "Widget override created (admin not affected)",
      widget: newWidget
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};