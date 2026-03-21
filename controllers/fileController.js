const prisma = require('../prisma/prismaClient');

exports.getFilePreview = async (req, res) => {
  try {
    const fileId = Number(req.params.fileId);
    const { status } = req.query; // VALID / INVALID / undefined

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required'
      });
    }

    // Check file exists
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Uploaded file not found'
      });
    }

    // Build filter condition
    const whereCondition = {
      fileId: fileId
    };

    if (status) {
      whereCondition.status = status; // VALID / INVALID
    }

    // Fetch rows
    const rows = await prisma.dataRow.findMany({
      where: whereCondition,
      orderBy: {
        id: 'asc'
      },
      take: 50 // preview limit (optional)
    });

    return res.status(200).json({
      success: true,
      message: 'Preview rows fetched successfully',
      data: rows
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Fetch preview failed',
      error: error.message
    });
  }
};