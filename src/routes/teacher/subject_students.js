import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import SubjectStudent from '../../models/subject_student.js';
import Grade from '../../models/grade.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import {
    createSubjectStudentSchema,
    deleteSubjectStudentByIdSchema,
    getSubjectStudentByIdSchema,
    getSubjectStudentListSchema,
    getSubjectStudentsEnrolledSchema,
} from '../../schema/teacher/subject_students.js';
import validate from '../../helpers/validator.js';

const app = new Hono().basePath('/subjects/students');

app.use('*', checkTeacherToken);

// GET ENDPOINTS
app.get(
    '/',
    zValidator('query', getSubjectStudentListSchema, validate),
    checkActiveSemester,
    async (c) => {
        const semester = c.get('semester');
        const {
            page,
            limit,
            subject_id,
            semester_id,
            keyword,
        } = c.req.valid('query');
        const skip = limit * (page - 1);

        if (!semester && !semester_id) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(statusCodes.NOT_FOUND, 'Please select a semester to proceed'));
        }

        const query = {
            subject_id,
            semester_id: semester_id || semester._id,
        };

        const total = await SubjectStudent.countDocuments(query);
        const subjectStudents = await SubjectStudent.find(query).lean();
        const students = await Student.find({
            _id: {
                $in: subjectStudents.map((subjectStudent) => subjectStudent.student_id),
            },
            ...(keyword && {
                $or: [
                    { first_name: { $regex: keyword, $options: 'i' } },
                    { last_name: { $regex: keyword, $options: 'i' } },
                    { middle_name: { $regex: keyword, $options: 'i' } },
                    { suffix: { $regex: keyword, $options: 'i' } },
                    { lrn: { $regex: keyword, $options: 'i' } },
                ],
            }),
        })
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1 })
            .lean();

        // Get Grades
        const gradeQuery = {
            subject_id,
            semester_id: semester_id || semester._id,
            student_id: {
                $in: students.map((student) => student._id),
            },
        };
        const grades = await Grade.find(gradeQuery).lean();

        students.forEach((student) => {
            const subjectStudent = subjectStudents
            // eslint-disable-next-line max-len
                .find((subjectStudent) => subjectStudent.student_id.toString() === student._id.toString());
            const gradeData = grades.filter((grade) => (
                grade.student_id.toString() === student._id.toString()
            ));
            const grade = {};
            gradeData.forEach((data) => {
                if (data.quarter === 1) {
                    grade.quarter_1 = data.grade;
                } else if (data.quarter === 2) {
                    grade.quarter_2 = data.grade;
                }
            });

            student.subject_student_id = subjectStudent._id;
            student.grade = grade;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: students.length,
            students,
        }));
    },
);

app.get(
    '/enrolled',
    zValidator('query', getSubjectStudentsEnrolledSchema, validate),
    checkActiveSemester,
    async (c) => {
        const semester = c.get('semester');
        if (!semester) {
            return c.json(generateResponse(statusCodes.OK, 'Success', { students: [] }));
        }
        const { subject_id } = c.req.valid('query');
        const query = {
            subject_id,
            semester_id: semester._id,
        };

        // Get subject students
        const subjectStudents = await SubjectStudent.find(query).lean();

        // Get student options
        const students = await Student
            .find({
                _id: {
                    $in: subjectStudents.map((subjectStudent) => subjectStudent.student_id),
                },
            })
            .sort({ last_name: 1 })
            .select('_id')
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { students: students.map((student) => student._id) }));
    },
);

app.get(
    '/:studentId',
    zValidator('param', getSubjectStudentByIdSchema, validate),
    async (c) => {
        const { studentId: id } = c.req.valid('param');

        const student = await Student.findById(id).lean();
        if (!student) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { student }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    zValidator('json', createSubjectStudentSchema, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const semester = c.get('semester');
        const { student: studentBody } = c.req.valid('json');
        const {
            subject_id,
            student_ids,
        } = studentBody;

        const subjectStudentExist = await SubjectStudent.exists({
            subject_id,
            semester_id: semester._id,
            student_id: { $in: student_ids || [] },
        });
        if (subjectStudentExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Student'));
        }

        // Subject information
        const subject = await Subject.findById(subject_id).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        const subjectStudents = student_ids.map((studentId) => ({
            subject_id,
            semester_id: semester._id,
            student_id: studentId,
            subject_name_snapshot: subject.name,
            subject_type_snapshot: subject.type,
            sy_start_snapshot: semester.sy_start_year,
            sy_end_snapshot: semester.sy_end_year,
            semester_term_snapshot: semester.term,
            created_by: teacher._id,
        }));

        await SubjectStudent.insertMany(subjectStudents);

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

// DELETE ENDPOINTS
app.delete(
    '/:subjectStudentId',
    zValidator('param', deleteSubjectStudentByIdSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { subjectStudentId: id } = c.req.valid('param');

        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            const msg = 'There is no active semester at the moment. '
                + 'You cannot delete a student when there is not active semester.';
            return c.json(generateResponse(statusCodes.NOT_FOUND, msg));
        }

        const subjectStudent = await SubjectStudent.findById(id);
        if (!subjectStudent) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject student'));
        }

        if (semester._id.toString() !== subjectStudent.semester_id.toString()) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(statusCodes.CONFLICT, 'Cannot delete student under inactive semester'));
        }

        // Check if student already has grade
        const gradeExist = await Grade.exists({
            subject_id: subjectStudent.subject_id,
            semester_id: semester._id,
            student_id: subjectStudent.student_id,
        });
        if (gradeExist) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'You cannot delete a student who has existing grades'));
        }

        await subjectStudent.deleteOne();

        return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: subjectStudent }));
    },
);

export default app;
