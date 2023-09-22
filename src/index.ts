import { serve } from "@hono/node-server";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { readFile } from "fs/promises";
import path from "path";

const PORT = 3000;

const app = new OpenAPIHono();

app.get('/', async ({ html }) => {
  const result = await readFile(path.resolve(__dirname, './public/index.html'));

  return html(result.toString());
});

app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              // file: z.instanceof(File),
              file: z.any(),
            })
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
            })
          }
        }
      },
      422: {
        description: 'Error',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean().openapi({ example: false }),
            })
          }
        }
      }
    }
  }),
  ({ req, json }) => {
    const input = req.valid('form');
    
    if (typeof input.file === 'object' && input.file instanceof File) {
      return json({ success: true });
    }

    return json({ success: false }, 422);
  }
);

app.onError((_, { json }) => {
  return json({ success: false }, 422);
});

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '0.0.0',
    title: 'Debug',
    description: 'This API provides all the data for managing the testing and class platform.',
  },
  tags: [],
  servers: [{ url: `http://localhost:${PORT}` }],
});

console.info(`Running on http://localhost:${PORT}`);

serve(app);
