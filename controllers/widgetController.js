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
    let { dashboardId, name, type, config, replaceWidgetId, fileId } = req.body;

    dashboardId = Number(dashboardId);

    if (!dashboardId || !type || !replaceWidgetId) {
      return res.status(400).json({
        message: "dashboardId, type & replaceWidgetId required"
      });
    }

 const normalizeConfig = (config = {}) => ({
  //////////////////////////////////////////////////////
  // 🔥 PRESERVE EVERYTHING (MAIN FIX)
  //////////////////////////////////////////////////////
  ...config,

  //////////////////////////////////////////////////////
  // 🔥 STANDARDIZE COMMON FIELDS
  //////////////////////////////////////////////////////
  groupBy: config.groupBy || config.xAxis?.[0],
  metrics: config.metrics || config.yAxis || [],
  xAxis: config.xAxis || [],
  yAxis: config.yAxis || [],

  //////////////////////////////////////////////////////
  // 🔥 IMPORTANT (FIX FUNNEL)
  //////////////////////////////////////////////////////
  steps: config.steps || []
});

    //////////////////////////////////////////////////////
    // 🔥 STEP 1: GET CLICKED WIDGET
    //////////////////////////////////////////////////////
    const clickedWidget = await prisma.widget.findUnique({
      where: { id: Number(replaceWidgetId) }
    });

    if (!clickedWidget) {
      return res.status(404).json({ message: "Widget not found" });
    }

    //////////////////////////////////////////////////////
    // 🔥 STEP 2: ALWAYS GET ROOT ADMIN ID
    //////////////////////////////////////////////////////
    const originalWidgetId =
      clickedWidget.originalWidgetId || clickedWidget.id;

    //////////////////////////////////////////////////////
    // 🔥 STEP 3: CHECK EXISTING USER WIDGET
    //////////////////////////////////////////////////////
    const existingUserWidget = await prisma.widget.findFirst({
      where: {
        dashboardId,
        createdById: req.user.id,
        originalWidgetId,
        fileId
      }
    });

    //////////////////////////////////////////////////////
    // ✅ CASE 1: UPDATE EXISTING (BEST FLOW)
    //////////////////////////////////////////////////////
    if (existingUserWidget) {
      const updated = await prisma.widget.update({
        where: { id: existingUserWidget.id },
        data: {
          name,
          type: type.toUpperCase(),
          config: normalizeConfig(config)
        }
      });

      return res.json({
        message: "Widget updated (Bar → Pie → Line → Table)",
        widget: updated
      });
    }

    //////////////////////////////////////////////////////
    // ✅ CASE 2: FIRST TIME REPLACE
    //////////////////////////////////////////////////////
    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        name,
        type: type.toUpperCase(),
        config: normalizeConfig(config),
        createdById: req.user.id,
        originalWidgetId, // 🔥 ALWAYS ADMIN ID
        isDefault: false,
        fileId
      }
    });

    res.json({
      message: "Widget replaced first time",
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