import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import ExcelJS from 'exceljs';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import Semester from '../../models/semester.js';
import SubjectStudent from '../../models/subject_student.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import {
    createSubjectStudentSchema,
    deleteSubjectStudentByIdSchema,
    getSubjectStudentByIdSchema,
    getSubjectStudentListSchema,
    getSubjectStudentOptionsSchema,
} from '../../schema/teacher/subject_students.js';
import validate from '../../helpers/validator.js';
import { capitalizeFirstLetter, formatFullName, generateRandomString } from '../../helpers/general.js';

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

        students.forEach((student) => {
            const subjectStudent = subjectStudents
            // eslint-disable-next-line max-len
                .find((subjectStudent) => subjectStudent.student_id.toString() === student._id.toString());

            student.subject_student_id = subjectStudent._id;
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
    '/options',
    zValidator('query', getSubjectStudentOptionsSchema, validate),
    async (c) => {
        const {
            subject_id,
            semester_id,
        } = c.req.valid('query');
        const query = {
            subject_id,
            semester_id,
        };

        // Get subject students
        const subjectStudents = await SubjectStudent.find(query).lean();

        // Get student options
        const students = await Student
            .find({
                _id: {
                    $nin: subjectStudents.map((subjectStudent) => subjectStudent.student_id),
                },
            })
            .sort({ last_name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { students }));
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
    async (c) => {
        const teacher = c.get('teacher');
        const { student: studentBody } = c.req.valid('json');
        const {
            subject_id,
            semester_id,
            student_ids,
        } = studentBody;

        const subjectStudentExist = await SubjectStudent.exists({
            subject_id,
            semester_id,
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

        // Semester information
        const semester = await Semester.findById(semester_id).lean();
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Semester'));
        }

        const subjectStudents = student_ids.map((studentId) => ({
            subject_id,
            semester_id,
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
        const subjectStudent = await SubjectStudent.findById(id);
        if (!subjectStudent) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject student'));
        }

        if (semester._id.toString() !== subjectStudent.semester_id.toString()) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(statusCodes.CONFLICT, 'Cannot delete student under inactive semester'));
        }

        await subjectStudent.deleteOne();

        return c.json(generateResponse(statusCodes.OK, 'Success', { subject_student: subjectStudent }));
    },
);

export default app;