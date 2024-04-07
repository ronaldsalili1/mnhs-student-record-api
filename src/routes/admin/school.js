import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import School from '../../models/school.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/school');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const school = await School.findOne().lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { school }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { school: schoolBody } = await c.req.json();
        const {
            name,
            school_id,
        } = schoolBody;

        const school = await School.findOne().lean();
        if (school) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('School'));
        }

        const newSchool = new School();
        newSchool.name = name;
        newSchool.school_id = school_id;
        newSchool.created_by = admin._id;

        await newSchool.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { school: newSchool }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { school: schoolBody } = await c.req.json();
        const {
            name,
            school_id,
        } = schoolBody;

        const school = await School.findOne();
        if (!school) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('School'));
        }

        school.name = name;
        school.school_id = school_id;
        school.updated_by = admin._id;

        await school.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { school }));
    },
);

export default app;
