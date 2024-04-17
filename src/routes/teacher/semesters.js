import { Hono } from 'hono';

// Models
import Semester from '../../models/semester.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';

const app = new Hono().basePath('/semesters');

app.use('*', checkTeacherToken);

app.get(
    '/options/all',
    async (c) => {
        const semesters = await Semester.find()
            .sort({ start_at: -1, term: -1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { semesters }));
    },
);

export default app;
