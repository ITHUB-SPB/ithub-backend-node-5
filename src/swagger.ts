import swaggerJSDoc, { type OAS3Definition } from "swagger-jsdoc";

const definition = {
    openapi: '3.2.0',
    info: {
        title: "Products API",
        version: "0.1.0",
        description: "Products API Docs",
    },
    host: `localhost:3000`,
    basePath: '/',
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT Access-Token'
            }
        },
        schemas: {
            Product: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    accountId: { type: "integer", example: 1 },
                    name: { type: "string", example: "Миксер" },
                    price: { type: "number", example: 200.20 },
                    category: {
                        type: "string",
                        enum: ["electronics", "clothing", "food", "other"],
                        example: "electronics"
                    },
                    imageUrl: { type: "string" },
                    archived: { type: "boolean" },
                    createdAt: { type: "string", format: "date" },
                    email: { type: "string", format: "email" }
                },
                required: ["id", "accountId", "name", "category", "archived", "createdAt", "email"]
            }
        }
    }
} as OAS3Definition

export const specs = swaggerJSDoc({
    apis: [
        './src/routes/*'
    ],
    definition,
})