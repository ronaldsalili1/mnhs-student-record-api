import { Hono } from 'hono';

import Section from '../../models/section.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/sections');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const {
            page = 1,
            limit = 10,
            teacher_id,
            grade_level,
            keyword,
        } = c.req.query();
        const skip = limit * (page - 1);
        const query = {
            ...(teacher_id && { teacher_id }),
            ...(grade_level && { grade_level }),
            ...(keyword && {
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                ],
            }),
        };

        const total = await Section.countDocuments(query);
        const sections = await Section.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: sections.length,
            sections,
        }));
    },
);
app.get(
    '/:sectionId',
    async (c) => {
        const id = c.req.param('sectionId');

        const section = await Section.findById(id).lean();
        if (!section) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { section }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { section: sectionBody } = await c.req.json();
        const {
            grade_level,
            name,
        } = sectionBody;

        const parsedName = name.trim().toLowerCase();
        const sectionExist = await Section.exists({ name: parsedName });
        if (sectionExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Section with the same name'));
        }

        const newSection = new Section();
        newSection.grade_level = grade_level;
        newSection.name = name;
        newSection.created_by = admin._id;

        await newSection.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { section: newSection }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:sectionId',
    async (c) => {
        const id = c.req.param('sectionId');
        const admin = c.get('admin');
        const { section: sectionBody } = await c.req.json();
        const {
            grade_level,
            name,
        } = sectionBody;

        const section = await Section.findById(id);
        if (!section) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section'));
        }

        const parsedName = name.trim().toLowerCase();
        const sectionExist = await Section.findOne({
            _id: { $ne: id },
            name: parsedName,
        });
        if (sectionExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Section with the same name'));
        }

        section.grade_level = grade_level;
        section.name = name;
        section.updated_by = admin._id;

        await section.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { section }));
    },
);

export default app;
