const prisma = require('../prisma/prismaClient');

exports.getDashboardPatterns = async (req, res) => {
  try {
    const dashboardId = Number(req.params.dashboardId);

    if (Number.isNaN(dashboardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dashboard id'
      });
    }

    const dashboard = await prisma.dashboard.findUnique({
      where: { dashboardId }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    const name = dashboard.dashboardName.trim().toLowerCase();
    let patterns = [];

    if (name.includes('vendor')) {
      patterns = [
        { widgetType: 'KPI_CARDS', requiredFields: ['metric'] },
        { widgetType: 'BAR_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'PIE_CHART', requiredFields: ['groupBy', 'metric'] },
        { widgetType: 'LINE_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'SCATTER_PLOT', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'TABLE', requiredFields: ['columns'] }
      ];
    } else if (name.includes('sales executive')) {
      patterns = [
        { widgetType: 'KPI_CARDS', requiredFields: ['metric'] },
        { widgetType: 'BAR_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'GAUGE_CHART', requiredFields: ['metric', 'targetField'] },
        { widgetType: 'MAP_CHART', requiredFields: ['locationField', 'metric'] },
        { widgetType: 'STACKED_CHART', requiredFields: ['xAxis', 'yAxis', 'groupBy'] },
        { widgetType: 'SCATTER_PLOT', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'LINE_CHART', requiredFields: ['xAxis', 'yAxis'] }
      ];
    } else if (name.includes('roi')) {
      patterns = [
        { widgetType: 'KPI_CARDS', requiredFields: ['metric'] },
        { widgetType: 'BAR_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'PIE_CHART', requiredFields: ['groupBy', 'metric'] },
        { widgetType: 'LINE_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'SCATTER_PLOT', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'TABLE', requiredFields: ['columns'] }
      ];
    } else {
      patterns = [
        { widgetType: 'KPI_CARDS', requiredFields: ['metric'] },
        { widgetType: 'BAR_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'PIE_CHART', requiredFields: ['groupBy', 'metric'] },
        { widgetType: 'LINE_CHART', requiredFields: ['xAxis', 'yAxis'] },
        { widgetType: 'TABLE', requiredFields: ['columns'] }
      ];
    }

    return res.status(200).json({
      success: true,
      message: 'Dashboard patterns fetched successfully',
      data: {
        dashboardId: dashboard.dashboardId,
        dashboardName: dashboard.dashboardName,
        patterns
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch dashboard patterns failed',
      error: error.message
    });
  }
};