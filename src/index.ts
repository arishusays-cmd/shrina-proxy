// index.ts (or index.js)

import 'dotenv/config';
import app from './app.js';
import { SERVER } from './config/constants.js';
import { logger } from './middleware.js';

// Detect environment
const USE_CLOUDFLARE = process.env.USE_CLOUDFLARE === 'true';

// ✅ Vercel handler (serverless entry point)
export default function handler(req, res) {
  try {
    logger.info(
      {
        type: 'server',
        env: SERVER.NODE_ENV,
        cloudflare: USE_CLOUDFLARE,
      },
      'Handling request with Vercel serverless function'
    );

    // Pass request to Express app
    app(req, res);
  } catch (err) {
    logger.error(
      {
        type: 'server',
        error: err instanceof Error ? err.message : String(err),
      },
      'Serverless function error'
    );
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
