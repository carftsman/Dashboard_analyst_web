const prisma = require('../prisma/prismaClient');
const { parseExcelFile } = require('../utils/excelParser');

const SALES_REQUIRED_COLUMNS = [
  'Executive ID',
  'Executive Name',
  'Region',
  'State',
  'City',
  'Vendors Onboarded',
  'Vendors Active',
  'Orders From Vendors',
  'Revenue From Vendors',
  'Visits Per Day',
  'Target Vendors',
  'Achievement Percentage',
  'Month'
];

// Validate headers
const validateHeaders = (uploadedHeaders) => {
  const missingColumns = SALES_REQUIRED_COLUMNS.filter(
    (col) => !uploadedHeaders.includes(col)
  );

  const extraColumns = uploadedHeaders.filter(
    (col) => !SALES_REQUIRED_COLUMNS.includes(col)
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    extraColumns
  };
};

// Validate row
const validateRow = (row) => {
  const errors = [];

  SALES_REQUIRED_COLUMNS.forEach((col) => {
    if (
      row[col] === undefined ||
      row[col] === null ||
      String(row[col]).trim() === ''
    ) {
      errors.push(`${col} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

exports.uploadSalesExcel = async (req, res) => {
  try {
    const { dashboardId } = req.body;

    if (!dashboardId) {
      return res.status(400).json({
        success: false,
        message: 'dashboardId is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    // 1️⃣ Find dashboard
    const dashboard = await prisma.dashboard.findUnique({
      where: { dashboardId: Number(dashboardId) }
    });

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    if (dashboard.category !== 'SALES') {
      return res.status(400).json({
        success: false,
        message: 'Only SALES dashboard allowed'
      });
    }

    // 2️⃣ Parse Excel
    const rows = parseExcelFile(req.file.path);

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      });
    }

    // 3️⃣ Validate headers
    const headers = Object.keys(rows[0]);
    const headerValidation = validateHeaders(headers);

    if (!headerValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Missing required columns',
        data: headerValidation
      });
    }

    // 4️⃣ Check uploading user
    const existingUser = await prisma.user.findUnique({
      where: { id: Number(req.user.id) }
    });

    console.log('req.user:', req.user);
    console.log('existingUser:', existingUser);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Uploading user not found in database',
        data: {
          tokenUserId: req.user.id,
          tokenEmail: req.user.email
        }
      });
    }

    // 5️⃣ Save uploaded file
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: req.file.filename,
        fileUrl: req.file.path,
        dashboardId: dashboard.dashboardId,
        uploadedById: existingUser.id,
        uploadedColumns: headers,
        extraColumns: headerValidation.extraColumns
      }
    });

    let validCount = 0;
    let invalidCount = 0;

    // 6️⃣ Save rows
    for (const row of rows) {
      const validation = validateRow(row);

      const createdRow = await prisma.dataRow.create({
        data: {
          fileId: uploadedFile.id,
          rowData: row,
          status: validation.isValid ? 'VALID' : 'INVALID'
        }
      });

      await prisma.validationResult.create({
        data: {
          rowId: createdRow.id,
          errors: validation.errors,
          isValid: validation.isValid
        }
      });

      if (validation.isValid) validCount++;
      else invalidCount++;
    }

    // 7️⃣ Update file status
    await prisma.uploadedFile.update({
      where: { id: uploadedFile.id },
      data: {
        status: invalidCount > 0 ? 'FAILED' : 'VALIDATED'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: uploadedFile.id,
        totalRows: rows.length,
        validRows: validCount,
        invalidRows: invalidCount,
        extraColumns: headerValidation.extraColumns
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};