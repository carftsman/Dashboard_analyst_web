const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

//////////////////////////////////////////////////////
// 📁 UPLOAD DIR
//////////////////////////////////////////////////////
const uploadDir = path.join(__dirname, "../../uploads/excel");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//////////////////////////////////////////////////////
// 🔐 SAFE FILENAME
//////////////////////////////////////////////////////
const generateFileName = (originalName) => {
  const ext = path.extname(originalName);
  const random = crypto.randomBytes(8).toString("hex");
  return `${Date.now()}-${random}${ext}`;
};

//////////////////////////////////////////////////////
// 💾 STORAGE
//////////////////////////////////////////////////////
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (req, file, cb) {
    cb(null, generateFileName(file.originalname));
  }
});

//////////////////////////////////////////////////////
// 🛡️ FILE FILTER (EXT + MIME)
//////////////////////////////////////////////////////
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const allowedMimeTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Only Excel/CSV files allowed"));
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"));
  }

  cb(null, true);
};

//////////////////////////////////////////////////////
// 🚀 MULTER INSTANCE
//////////////////////////////////////////////////////
const uploadExcel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const cleanupFile = (req, res, next) => {
  const cleanup = () => {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, err => {
        if (err) 
          logger.error("File cleanup failed", {
  error: err.message
});
      });
    }
  };

  // ✅ normal response
  res.on("finish", cleanup);

  // ✅ if connection closes unexpectedly
  res.on("close", cleanup);

  next();
};

//////////////////////////////////////////////////////
// EXPORT
//////////////////////////////////////////////////////
module.exports = {
  uploadExcel,
  cleanupFile
};