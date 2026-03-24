exports.applyMapping = (rows, mappings) => {
  return rows.map(row => {
    const newRow = {};

    mappings.forEach(m => {
      const fileKey = Object.keys(row).find(
        key => key.toLowerCase() === m.fileColumn.toLowerCase()
      );

      if (fileKey) {
        newRow[m.templateField] = row[fileKey];
      }
    });

    return newRow;
  });
};