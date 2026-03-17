const prisma = require('../prisma/prismaClient');

exports.createReport = async (req, res) => {
  try {
    const { title, reportType, description, fileId, generatedById } = req.body;

    const report = await prisma.report.create({
      data: {
        title,
        reportType,
        description,
        fileId,
        generatedById
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Create report failed',
      error: error.message
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        file: true,
        generatedBy: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Reports fetched successfully',
      data: reports
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch reports failed',
      error: error.message
    });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        file: true,
        generatedBy: true
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Report fetched successfully',
      data: report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch report failed',
      error: error.message
    });
  }
};