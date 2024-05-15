import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';

import config from './config/index.js';
import initializeMongo from './bin/mongo.js';
import statusCodes from './constants/statusCodes.js';
import { generateResponse } from './helpers/response.js';
import importAll from './helpers/importAll.js';

const adminRoutes = await importAll('/routes/admin');
const teacherRoutes = await importAll('/routes/teacher');
const studentRoutes = await importAll('/routes/student');
const workerRoutes = await importAll('/routes/worker');

const app = new Hono();
const port = config.api.port || 3000;

// Middlewares
app.use('*', logger());

const origin = [config.admin.host, config.teacher.host, config.student.host];
app.use('*', csrf({ origin }));
app.use('*', cors({
    origin,
    credentials: true,
}));

// Use all routes
const routes = {
    admin: adminRoutes,
    teacher: teacherRoutes,
    student: studentRoutes,
    worker: workerRoutes,
};
for (const routeKey in routes) {
    if (Object.hasOwnProperty.call(routes, routeKey)) {
        const routeGroups = routes[routeKey];

        for (const routeGroupKey in routeGroups) {
            if (Object.hasOwnProperty.call(routeGroups, routeGroupKey)) {
                const routeGroup = routeGroups[routeGroupKey];
                app.route(`/${routeKey}`, routeGroup);
            }
        }
    }
}

// Route not found
app.use('*', (c) => {
    c.status(statusCodes.NOT_FOUND);
    return c.json(generateResponse(404, 'Route does not exist'));
});

console.log('[!] Starting server');

initializeMongo()
    .then(() => console.log(`[!] Server is running on port ${port}`))
    .catch((error) => console.error(error.message));

serve({
    fetch: app.fetch,
    port,
});
