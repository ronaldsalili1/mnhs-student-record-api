import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import Section from '../../models/section.js';
import { getSectionOptionsSchema } from '../../schema/teacher/sections.js';
import validate from '../../helpers/validator.js';
import { generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';

const app = new Hono().basePath('/sections');

app.use('*', checkTeacherToken);

app.get(
    '/options',
    zValidator('query', getSectionOptionsSchema, validate),
    async (c) => {
        const { keyword } = c.req.valid('query');
        const query = {
            ...(keyword && {
                name: { $regex: keyword, $options: 'i' },
            }),
        };

        const sections = await Section.find(query)
            .sort({ name: 1 })
            .limit(5)
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { sections }));
    },
);

export default app;
