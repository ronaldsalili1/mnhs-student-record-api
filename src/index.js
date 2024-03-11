import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import initializeMongo from './bin/mongo.js';
import routes from './routes/routes.js';

const app = new Hono();
const port = process.env.PORT || 3000;

app.get('/', (c) => c.text('Hello Hono!'));

// Middlewares
app.use('*', cors({
    origin: [process.env.ADMIN_PANEL, process.env.TEACHER_PANEL, process.env.STUDENT_PANEL],
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
