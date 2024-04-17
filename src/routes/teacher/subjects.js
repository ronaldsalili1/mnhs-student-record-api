import { Hono } from 'hono';
import dayjs from 'dayjs';
import { zValidator } from '@hono/zod-validator';

// Models
import Subject from '../../models/subject.js';
import SubjectTeacher from '../../models/subject_teacher.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import { getSubjectListSchema, getSubjectByIdSchema } from '../../schema/teacher/subjects.js';
import validate from '../../helpers/validator.js';

const app = new Hono().basePath('/subjects');

app.use('*', checkTeacherToken);

app.get(
    '/',
    zValidator('query', getSubjectListSchema, validate),
    async (c) => {
        const teacher = c.get('teacher');
        const { page, limit } = c.req.valid('query');
        const skip = limit * (page - 1);
        const now = dayjs().startOf('day').toDate();
        const query = {
            $and: [
                { teacher_id: teacher._id },
                { start_at: { $lte: now } },
                {
                    $or: [
                        { end_at: null },
                        { end_at: { $exists: false } },
                        { end_at: { $gt: now } },
                    ],
                },
            ],
        };

        const total = await SubjectTeacher.countDocuments(query);
        const subjectTeachers = await SubjectTeacher.find(query).lean();
        const subjects = await Subject.find({
            _id: { $in: subjectTeachers.map((subjectTeacher) => subjectTeacher.subject_id) },
        })
            .limit(limit)
            .skip(skip)
            .sort({ name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: subjects.length,
            subjects,
        }));
    },
);

app.get(
    '/options',
    async (c) => {
        const teacher = c.get('teacher');
        const now = dayjs().startOf('day').toDate();
        const query = {
            $and: [
                { teacher_id: teacher._id },
                { start_at: { $lte: now } },
                {
                    $or: [
                        { end_at: null },
                        { end_at: { $exists: false } },
                        { end_at: { $gt: now } },
                    ],
                },
            ],
        };
        const subjectTeachers = await SubjectTeacher.find(query).lean();
        const subjects = await Subject.find({
            _id: { $in: subjectTeachers.map((subjectTeacher) => subjectTeacher.subject_id) },
        })
            .sort({ name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { subjects }));
    },
);

app.get(
    '/:subjectId',
    zValidator('param', getSubjectByIdSchema, validate),
    async (c) => {
        const { subjectId } = c.req.valid('param');

        const subject = await Subject.findById(subjectId).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { subject }));
    },
);

export default app;
