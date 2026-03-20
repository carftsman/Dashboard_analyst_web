const xlsx = require('xlsx');

const parseExcelFile = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: ' ' });

  return rows;
};

module.exports = {
  parseExcelFile
};