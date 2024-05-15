import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Grade from '../../models/grade.js';
import Subject from '../../models/subject.js';
import SectionSubject from '../../models/section_subject.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateResponse } from '../../helpers/response.js';
import checkStudentToken from '../../middlewares/checkStudentToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

import validate from '../../helpers/validator.js';
import { getGradeListSchema } from '../../schema/student/grades.js';

const app = new Hono().basePath('/grades');

app.use('*', checkStudentToken);

app.get(
    '/',
    zValidator('query', getGradeListSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { semester_id } = c.req.valid('query');
        const semester = c.get('semester');
        if (!semester && !semester_id) {
            return c.json(generateResponse(statusCodes.OK, 'Success', { grades: [] }));
        }

        const sectionSubjects = await SectionSubject.find({
            semester_id: semester?._id || semester_id,
        })
            .lean();

        const subjects = await Subject.find({
            _id: {
                $in: sectionSubjects.map((sectionSubject) => sectionSubject.subject_id),
            },
        })
            .sort({ name: 1 })
            .lean();

        const student = c.get('student');
        const grades = await Grade.find({
            subject_id: {
                $in: sectionSubjects.map((sectionSubject) => sectionSubject.subject_id),
            },
            semester_id: semester?._id || semester_id,
            student_id: student._id,
        })
            .populate('grade_submission_id')
            .lean();

        const gradeData = subjects.map((subject) => {
            const { _id: subjectId } = subject;

            const quarterGrades = grades.filter((grade) => (
                grade.grade_submission_id.status === 'approved'
                && subjectId.toString() === grade.subject_id.toString()
            ));

            const grade = {};
            quarterGrades.forEach((data) => {
                if (data.quarter === 1) {
                    grade.quarter_1 = data.grade;
                } else if (data.quarter === 2) {
                    grade.quarter_2 = data.grade;
                }
            });

            return {
                ...subject,
                grade,
            };
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', { grades: gradeData }));
    },
);

export default app;
