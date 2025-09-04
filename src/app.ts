import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import * as helmet from 'helmet'; // Fixed import for TS 5+ ESM
import { SERVER, ROUTES } from './config/constants.js';
import { corsMiddleware, errorHandler, requestLogger } from './middleware.js';
import proxyRoutes from './proxy-routes.js';

const app: Express = express();

// --------------------
// Global Middleware
// --------------------
app.use(compression());

// helmet requires calling .default in TS 5+ with NodeNext
app.use(
  (helmet as any)({
    contentSecurityPolicy: false, // Disable CSP for proxy functionality
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Middleware
app.use(corsMiddleware);
app.use(requestLogger);

// --------------------
// Routes
// --------------------
app.use(ROUTES.PROXY_BASE, proxyRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Shinra Proxy',
    version: process.env.npm_package_version || '0.2.0',
    description:
      'A modular CORS proxy built with Express and TypeScript, supporting m3u8 and related formats',
    usage: {
      queryParam: `${ROUTES.PROXY_BASE}?url=https://example.com`,
      pathParam: `${ROUTES.PROXY_BASE}/https://example.com`,
      base64: `${ROUTES.PROXY_BASE}/base64/${Buffer.from('https://example.com').toString(
        'base64'
      )}`,
    },
    status: `${ROUTES.PROXY_BASE}/status`,
  });
});

// Status endpoint
app.get(`${ROUTES.PROXY_BASE}/status`, (_req: Request, res: Response) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '0.2.0',
    uptime,
    timestamp: new Date().toISOString(),
    environment: SERVER.NODE_ENV,
    memory: {
      rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      external: Math.round((memory.external / 1024 / 1024) * 100) / 100,
    },
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 404,
      message: 'Not Found',
      path: _req.path,
    },
    success: false,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, _req, res, _next);
});

export default app;
