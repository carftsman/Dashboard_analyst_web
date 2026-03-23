const prisma = require('../prisma/prismaClient');

exports.createDashboard = async (req, res) => {
  try {
    const { dashboardName, description } = req.body;

    // 1️⃣ Validate input
    if (!dashboardName) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard name is required'
      });
    }

    // 2️⃣ Check duplicate (case-insensitive)
    const existingDashboard = await prisma.dashboard.findFirst({
      where: {
        dashboardName: {
          equals: dashboardName.trim(),
          mode: 'insensitive'
        },
        createdById: req.user.id
      }
    });

    if (existingDashboard) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard name already exists'
      });
    }

    // 3️⃣ Create dashboard (without category)
    const dashboard = await prisma.dashboard.create({
      data: {
        dashboardName: dashboardName.trim(),
        description,
        createdById: req.user.id
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Dashboard created successfully',
      data: dashboard
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create dashboard failed',
      error: error.message
    });
  }
};
exports.getDashboards = async (req, res) => {
  try {
    const dashboards = await prisma.dashboard.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboards fetched successfully',
      data: dashboards
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch dashboards failed',
      error: error.message
    });
  }
};

exports.getDashboardById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const dashboard = await prisma.dashboard.findUnique({
      where: { id }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dashboard fetched successfully',
      data: dashboard
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch dashboard failed',
      error: error.message
    });
  }
};

exports.updateDashboard = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { dashboardName, category, description, status } = req.body;

    const dashboard = await prisma.dashboard.update({
      where: { id },
      data: {
        dashboardName,
        category,
        description,
        status
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard updated successfully',
      data: dashboard
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Update dashboard failed',
      error: error.message
    });
  }
};

exports.deleteDashboard = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.dashboard.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Delete dashboard failed',
      error: error.message
    });
  }
};

