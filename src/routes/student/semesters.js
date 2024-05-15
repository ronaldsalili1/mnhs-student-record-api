import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Semester from '../../models/semester.js';
import SectionStudent from '../../models/section_student.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateResponse } from '../../helpers/response.js';
import checkStudentToken from '../../middlewares/checkStudentToken.js';
import validate from '../../helpers/validator.js';
import { getSemesterOptionsSchema } from '../../schema/student/semesters.js';

const app = new Hono().basePath('/semesters');

app.use('*', checkStudentToken);

app.get(
    '/options',
    zValidator('query', getSemesterOptionsSchema, validate),
    async (c) => {
        const student = c.get('student');

        const sectionStudents = await SectionStudent.find({ student_id: student._id }).lean();

        const { year } = c.req.valid('query');
        const query = {
            _id: {
                $in: sectionStudents.map((sectionStudent) => sectionStudent.semester_id),
            },
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

export default app;
