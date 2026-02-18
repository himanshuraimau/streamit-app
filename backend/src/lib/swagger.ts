import swaggerJsdoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Streamit API',
      version: '1.0.0',
      description:
        'REST API for the Streamit live-streaming platform. Handles authentication, streaming, content, payments, social features, and more.',
      contact: {
        name: 'Streamit Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
      {
        url: 'https://voltstream.space',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Better Auth bearer token. Obtain via POST /api/auth/signin/email.',
        },
        CookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'better-auth.session_token',
          description: 'Session cookie set automatically on sign-in.',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'You must be signed in to access this resource',
                  },
                  code: { type: 'string', example: 'UNAUTHORIZED' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request body validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string', example: 'Validation failed' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Internal server error' },
                },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }, { CookieAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication and OTP flows' },
      { name: 'Stream', description: 'Live stream management' },
      { name: 'Content', description: 'Posts, media, comments, likes' },
      { name: 'Viewer', description: 'Viewer profile and follow/subscription management' },
      { name: 'Social', description: 'Follows, notifications, activity feeds' },
      { name: 'Payment', description: 'Coin wallet, packages, gifts, penny tips' },
      { name: 'Creator', description: 'Creator application and file management' },
      { name: 'Search', description: 'Full-text search across streams, users, categories' },
      { name: 'Discount', description: 'Discount codes and promotions' },
      { name: 'Webhook', description: 'LiveKit and Dodo Payments webhook receivers' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
