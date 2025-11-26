const swaggerJsdoc = require("swagger-jsdoc");
const config = require("../config");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "HelioScape API",
      version: "1.0.0",
      description:
        "API Documentation for HelioScape Distributed Storage System",
      contact: {
        name: "HelioScape Support",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
