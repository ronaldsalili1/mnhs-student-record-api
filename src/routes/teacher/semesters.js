import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Semester from '../../models/semester.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import validate from '../../helpers/validator.js';
import { getSemesterOptionsSchema } from '../../schema/teacher/semesters.js';

const app = new Hono().basePath('/semesters');

app.use('*', checkTeacherToken);

app.get(
    '/options',
    zValidator('query', getSemesterOptionsSchema, validate),
    async (c) => {
        const { year } = c.req.valid('query');
        const query = {
            ...(!year && {
                status: { $ne: 'active' },
            }),
            ...(year && {
                $or: [
                    { sy_start_year: year },
                    { sy_end_year: year },
                ],
            }),
        };

        const semesters = await Semester.find(query)
            .sort({ start_at: -1 })
            .limit(4)
            .lean();

        if (!year) {
            const activeSemeter = await Semester.findOne({ status: 'active' }).lean();
            if (activeSemeter) {
                semesters.unshift(activeSemeter);
            }
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { semesters }));
    },
);

app.get(
    '/options/all',
    async (c) => {
        const semesters = await Semester.find()
            .sort({ start_at: -1 })
            .limit(4)
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { semesters }));
    },
);

export default app;
