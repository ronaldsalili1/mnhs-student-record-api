import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import Semester from '../../models/semester.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/semesters');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const {
            page = 1,
            limit = 10,
        } = c.req.query();
        const skip = limit * (page - 1);
        const query = {};

        const total = await Semester.countDocuments(query);
        const semesters = await Semester.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ start_at: -1, term: -1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: semesters.length,
            semesters,
        }));
    },
);
app.get(
    '/:semesterId',
    async (c) => {
        const id = c.req.param('semesterId');

        const semester = await Semester.findById(id).lean();
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Semester'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { semester }));
    },
);
app.get('/options/all', async (c) => {
    const semesters = await Semester.find().sort({ start_at: -1, term: -1 }).lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', { semesters }));
});

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { semester: semesterBody } = await c.req.json();
        const {
            sy_start_year,
            sy_end_year,
            start_at,
            end_at,
            term,
            status,
        } = semesterBody;

        // Check if semester already exist
        const semesterExist = await Semester.exists({ start_at, end_at, term });
        if (semesterExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Semester'));
        }

        // Check status. Only one "active" semester is allowed
        if (status === 'active') {
            const currentSemesterExist = await Semester.exists({ status: 'active' });
            if (currentSemesterExist) {
                c.status(statusCodes.CONFLICT);
                return c.json(generateRecordExistsReponse('Semester with status "active"'));
            }
        }

        const newSemester = new Semester();
        newSemester.sy_start_year = sy_start_year;
        newSemester.sy_end_year = sy_end_year;
        newSemester.start_at = start_at;
        newSemester.end_at = end_at;
        newSemester.term = term;
        newSemester.status = status;
        newSemester.created_by = admin._id;

        await newSemester.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { semester: newSemester }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:semesterId',
    async (c) => {
        const id = c.req.param('semesterId');
        const admin = c.get('admin');
        const { semester: semesterBody } = await c.req.json();
        const {
            sy_start_year,
            sy_end_year,
            start_at,
            end_at,
            term,
            status,
        } = semesterBody;

        const semester = await Semester.findById(id);
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Semester'));
        }

        // Check if semester already exist
        const semesterExist = await Semester.exists({
            _id: { $ne: id },
            start_at,
            end_at,
            term,
        });
        if (semesterExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Semester'));
        }

        // Check status. Only one "active" semester is allowed
        if (status === 'active') {
            const currentSemesterExist = await Semester.exists({ _id: { $ne: id }, status: 'active' });
            if (currentSemesterExist) {
                c.status(statusCodes.CONFLICT);
                return c.json(generateRecordExistsReponse('Semester with status "active"'));
            }
        }

        semester.sy_start_year = sy_start_year;
        semester.sy_end_year = sy_end_year;
        semester.start_at = start_at;
        semester.end_at = end_at;
        semester.term = term;
        semester.status = status;
        semester.updated_by = admin._id;

        await semester.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { semester }));
    },
);

export default app;
