require("dotenv").config();

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

    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://dashboard-backend-cyrd.onrender.com"
            : `http://localhost:${PORT}`,
        description: "Server",
      },
    ],
  },

  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerSetup = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  const swaggerUrl =
    process.env.NODE_ENV === "production"
      ? "https://dashboard-backend-cyrd.onrender.com/api-docs"
      : `http://localhost:${PORT}/api-docs`;

  console.log(`Swagger Documentation Loaded → ${swaggerUrl}`);
};

module.exports = { swaggerSetup };