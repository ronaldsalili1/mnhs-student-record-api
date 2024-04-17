import { Hono } from 'hono';

// Models
import Admin from '../../models/admin.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';

const app = new Hono().basePath('/admins');

app.use('*', checkTeacherToken);

app.get(
    '/options/reviewers',
    async (c) => {
        const reviewers = await Admin.find({ roles: 'head_teacher' })
            .sort({ last_name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { reviewers }));
    },
);

export default app;
