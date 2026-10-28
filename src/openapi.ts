import { OpenAPIGenerator } from '@orpc/openapi'
import {
    ZodToJsonSchemaConverter
} from '@orpc/zod/zod4'
import { productsRouterOrpc } from './routes/products.js'

const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [
        new ZodToJsonSchemaConverter(),
    ],
})

export const openApiDocument = await openAPIGenerator.generate(productsRouterOrpc, {
    info: {
        title: "Products API",
        version: "0.1.0",
        description: "Products API Docs",
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT Access-Token'
            }
        }
    }
})