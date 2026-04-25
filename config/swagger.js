require("dotenv").config();
const logger = require("../utils/logger");

const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const PORT = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Data Analyst Dashboard",
      version: "1.0.0",
      description: "Data Visualization",
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    // ✅ GLOBAL AUTH (no need to write in every API)
    security: [
      {
        bearerAuth: [],
      },
    ],

servers: [
  {
    url: `http://localhost:${PORT}`,
    description: "Local server"
  },
  {
    url: process.env.PROD_URL,
    description: "Production server"
  }
],
  },

  // ✅ scan routes + controllers
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerSetup = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const baseUrl = process.env.PROD_URL || `http://localhost:${PORT}`;
logger.info("Swagger initialized", {
  url: `${baseUrl}/api-docs`
});
};

module.exports = { swaggerSetup };