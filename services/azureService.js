const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

let containerClient;
const fs = require("fs");


const initAzure = async () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  containerClient = blobServiceClient.getContainerClient(containerName);

  await containerClient.createIfNotExists({
    access: "blob"
  });
};

//////////////////////////////////////////////////////
// 🔥 DYNAMIC CONTENT TYPE (IMPORTANT)
//////////////////////////////////////////////////////
const getContentType = (fileName) => {
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (fileName.endsWith(".csv")) return "text/csv";
  if (fileName.endsWith(".png")) return "image/png";
  return "application/octet-stream";
};

//////////////////////////////////////////////////////
// ✅ UPLOAD FUNCTION
//////////////////////////////////////////////////////
exports.uploadFile = async (buffer, fileName) => {
  if (!containerClient) {
    await initAzure();
  }

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: getContentType(fileName) // ✅ FIXED
    }
  });

  return blockBlobClient.url;
};
exports.uploadFileFromPath = async (filePath, fileName) => {
  if (!containerClient) {
    await initAzure();
  }

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const stream = fs.createReadStream(filePath);

  await blockBlobClient.uploadStream(stream, undefined, undefined, {
    blobHTTPHeaders: {
      blobContentType: getContentType(fileName)
    }
  });

  return blockBlobClient.url;
};