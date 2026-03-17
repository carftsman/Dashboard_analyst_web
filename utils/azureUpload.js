const { BlobServiceClient } = require("@azure/storage-blob");
const multer = require("multer");
const path = require("path");
// const { v4: uuidv4 } = require("uuid");

const AZURE_CONTAINER = process.env.AZURE_CONTAINER_NAME;
const AZURE_CONNECTION = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Use memory storage for Azure uploads
const upload = multer({ storage: multer.memoryStorage() });

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_CONNECTION
);

// Azure upload reusable function
async function uploadToAzure(file, folder) {
  const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);

  const ext = path.extname(file.originalname);
  const uniqueName = `${folder}/${Date.now()}${ext}`;

  const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url;
}

module.exports = { upload, uploadToAzure };
