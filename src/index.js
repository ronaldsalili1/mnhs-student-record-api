import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import config from './config/index.js';
import initializeMongo from './bin/mongo.js';
import routes from './routes/routes.js';

const app = new Hono();
const port = config.api.port || 3000;

// Middlewares
const origin = [config.admin.host, config.teacher.host, config.student.host];
app.use('*', cors({
    origin,
    credentials: true,
}));
app.use('*', logger());

// Routes
const useRoutes = (routes) => {
    for (const item of routes) {
        if (!item.length) {
            app.route('/', item);
            continue;
        }

        useRoutes(item);
    }
};
useRoutes(routes);

console.log('[!] Starting server');

initializeMongo();
console.log('[!] MongoDB initialized');
console.log(`[!] Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
