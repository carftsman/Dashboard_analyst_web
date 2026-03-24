const getWidgetDefinitions = () => {
  return [
    {
      widgetType: 'KPI_CARDS',
      displayName: 'KPI Cards',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'metric', label: 'Metric Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'BAR_CHART',
      displayName: 'Bar Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'xAxis', label: 'X-Axis Column', type: 'column', required: true },
        { field: 'yAxis', label: 'Y-Axis Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'LINE_CHART',
      displayName: 'Line Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'xAxis', label: 'X-Axis Column', type: 'column', required: true },
        { field: 'yAxis', label: 'Y-Axis Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'PIE_CHART',
      displayName: 'Pie Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'groupBy', label: 'Group By Column', type: 'column', required: true },
        { field: 'metric', label: 'Metric Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'TABLE',
      displayName: 'Table',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'columns', label: 'Columns', type: 'multi_column', required: true }
      ]
    },
    {
      widgetType: 'SCATTER_PLOT',
      displayName: 'Scatter Plot',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'xAxis', label: 'X-Axis Column', type: 'column', required: true },
        { field: 'yAxis', label: 'Y-Axis Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'STACKED_CHART',
      displayName: 'Stacked Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'xAxis', label: 'X-Axis Column', type: 'column', required: true },
        { field: 'yAxis', label: 'Y-Axis Column', type: 'column', required: true },
        { field: 'groupBy', label: 'Group By Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'GAUGE_CHART',
      displayName: 'Gauge Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'metric', label: 'Metric Column', type: 'column', required: true },
        { field: 'targetField', label: 'Target Column', type: 'column', required: true }
      ]
    },
    {
      widgetType: 'MAP_CHART',
      displayName: 'Map Chart',
      inputs: [
        { field: 'title', label: 'Title', type: 'text', required: true },
        { field: 'locationField', label: 'Location Column', type: 'column', required: true },
        { field: 'metric', label: 'Metric Column', type: 'column', required: true }
      ]
    }
  ];
};

const widgetRules = {
  KPI_CARDS: ['metric'],
  BAR_CHART: ['xAxis', 'yAxis'],
  LINE_CHART: ['xAxis', 'yAxis'],
  PIE_CHART: ['groupBy', 'metric'],
  TABLE: ['columns'],
  SCATTER_PLOT: ['xAxis', 'yAxis'],
  STACKED_CHART: ['xAxis', 'yAxis', 'groupBy'],
  GAUGE_CHART: ['metric', 'targetField'],
  MAP_CHART: ['locationField', 'metric']
};

module.exports = {
  getWidgetDefinitions,
  widgetRules
};