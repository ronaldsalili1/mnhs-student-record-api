import { Hono } from 'hono';
import dayjs from 'dayjs';
import { zValidator } from '@hono/zod-validator';

// Models
import Student from '../../models/student.js';
import Section from '../../models/section.js';
import SectionStudent from '../../models/section_student.js';
import SectionAdviser from '../../models/section_adviser.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import validate from '../../helpers/validator.js';
import {
    createSectionStudents,
    deleteSectionStudentByIdSchema,
    getStudentListSchema,
    getStudentOptionsSchema,
} from '../../schema/teacher/students.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

const app = new Hono().basePath('/students');

app.use('*', checkTeacherToken);

// GET ENDPOINTS
app.get(
    '/',
    zValidator('query', getStudentListSchema, validate),
    checkActiveSemester,
    async (c) => {
        const {
            page,
            limit,
            semester_id,
            section_id,
            keyword,
        } = c.req.valid('query');
        const skip = limit * (page - 1);

        const teacher = c.get('teacher');
        const now = dayjs();
        const sectionAdviserQuery = {
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
            ...(section_id && { section_id }),
        };

        // Get the current section of the teacher
        const sectionAdvisers = await SectionAdviser.find(sectionAdviserQuery).lean();

        // Get all the students
        const semester = c.get('semester');
        const sectionStudentQuery = {
            semester_id: semester_id || semester._id,
            section_id: sectionAdvisers.map((sectionAdviser) => sectionAdviser.section_id),
        };
        const sectionStudents = await SectionStudent.find(sectionStudentQuery)
            .populate('section_id')
            .lean();

        const studentQuery = {
            _id: {
                $in: sectionStudents.map((sectionStudent) => sectionStudent.student_id),
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
        };
        const total = await Student.countDocuments(studentQuery);
        const students = await Student.find(studentQuery)
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1 })
            .lean();

        students.forEach((student) => {
            const sectionStudent = sectionStudents.find((sectionStudent) => (
                sectionStudent.student_id.toString() === student._id.toString()
            ));

            sectionStudent.section = sectionStudent.section_id;
            delete sectionStudent.section_id;

            student.section_student = sectionStudent;
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
    '/options/advisees',
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');

        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        const now = dayjs();
        const sectionAdviserQuery = {
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
        // Get the current section of the teacher
        const sectionAdvisers = await SectionAdviser.find(sectionAdviserQuery).lean();

        const sectionStudentQuery = {
            semester_id: semester._id,
            section_id: { $in: sectionAdvisers.map((sectionAdviser) => sectionAdviser.section_id) },
        };
        const sectionStudents = await SectionStudent.find(sectionStudentQuery)
            .populate('section_id')
            .lean();

        const studentQuery = {
            _id: {
                $in: sectionStudents.map((sectionStudent) => sectionStudent.student_id),
            },
        };
        const students = await Student.find(studentQuery)
            .sort({ last_name: 1, first_name: 1, middle_name: 1 })
            .lean();

        students.forEach((student) => {
            // eslint-disable-next-line arrow-body-style
            const sectionStudent = sectionStudents.find((sectionStudent) => {
                return sectionStudent.student_id.toString() === student._id.toString();
            });

            if (sectionStudent) {
                student.section = sectionStudent.section_id;
            }
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', { students }));
    },
);

app.get(
    '/options',
    zValidator('query', getStudentOptionsSchema, validate),
    checkActiveSemester,
    async (c) => {
        const {
            page,
            limit,
            section_id,
            keyword,
            exclude,
            exclude_students_in_section,
        } = c.req.valid('query');
        const skip = limit * (page - 1);

        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }
        const sectionStudentQuery = { semester_id: semester._id };
        const sectionStudents = await SectionStudent.find(sectionStudentQuery)
            .populate('section_id')
            .lean();

        let studentQuery = {
            ...(keyword && {
                $or: [
                    { first_name: { $regex: keyword, $options: 'i' } },
                    { last_name: { $regex: keyword, $options: 'i' } },
                    { middle_name: { $regex: keyword, $options: 'i' } },
                    { suffix: { $regex: keyword, $options: 'i' } },
                    { lrn: { $regex: keyword, $options: 'i' } },
                ],
            }),
            shs_graduation_date: { $exists: false },
        };

        if (exclude_students_in_section) {
            studentQuery._id = {
                $nin: sectionStudents.map((sectionStudent) => sectionStudent.student_id),
            };
        } else if (exclude && section_id) {
            studentQuery.$and = [
                {
                    _id: {
                        $in: sectionStudents.map((sectionStudent) => {
                            if (sectionStudent.section_id._id.toString() === section_id) {
                                return sectionStudent.student_id;
                            }

                            return null;
                        }).filter((d) => d !== null),
                    },
                },
                {
                    _id: {
                        $nin: JSON.parse(exclude),
                    },
                },
            ];
        } else {
            studentQuery = {
                ...studentQuery,
                ...(section_id && {
                    _id: {
                        $in: sectionStudents.map((sectionStudent) => {
                            if (sectionStudent.section_id._id.toString() === section_id) {
                                return sectionStudent.student_id;
                            }

                            return null;
                        }).filter((d) => d !== null),
                    },
                }),
                ...(exclude && {
                    _id: {
                        $nin: JSON.parse(exclude),
                    },
                }),
            };
        }

        const total = await Student.countDocuments(studentQuery);
        const students = await Student.find(studentQuery)
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1, first_name: 1, middle_name: 1 })
            .lean();

        students.forEach((student) => {
            const sectionStudent = sectionStudents.find((sectionStudent) => (
                sectionStudent.student_id.toString() === student._id.toString()
            ));

            student.section = sectionStudent ? sectionStudent.section_id : null;
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

// POST ENDPOINTS
app.post(
    '/',
    zValidator('json', createSectionStudents, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const semester = c.get('semester');
        const { section_students: sectionStudentsBody } = c.req.valid('json');
        const {
            section_id,
            student_ids,
        } = sectionStudentsBody;

        // Check for duplicates
        const sectionStudentExist1 = await SectionStudent.exists({
            section_id,
            semester_id: semester._id,
            student_id: { $in: student_ids || [] },
        }).lean();
        if (sectionStudentExist1) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(409, 'Student already exist in this section'));
        }

        const sectionStudentExist2 = await SectionStudent.exists({
            semester_id: semester._id,
            student_id: { $in: student_ids || [] },
        }).lean();
        if (sectionStudentExist2) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(409, 'Student already exist in other section'));
        }

        // Get section
        const section = await Section.findById(section_id).lean();
        if (!section) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section'));
        }

        const sectionStudents = student_ids.map((studentId) => ({
            section_id,
            semester_id: semester._id,
            student_id: studentId,
            section_name_snapshot: section.name,
            grade_level_snapshot: section.grade_level,
            sy_start_snapshot: semester.sy_start_year,
            sy_end_snapshot: semester.sy_end_year,
            semester_term_snapshot: semester.term,
            created_by: teacher._id,
        }));

        await SectionStudent.insertMany(sectionStudents);

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

// DELETE ENDPOINTS
app.delete(
    '/:sectionStudentId',
    zValidator('param', deleteSectionStudentByIdSchema, validate),
    async (c) => {
        const { sectionStudentId } = c.req.valid('param');

        const sectionStudent = await SectionStudent.findByIdAndDelete(sectionStudentId);
        if (!sectionStudent) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(statusCodes.NOT_FOUND, 'The student is currenly not registered in this section.'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { section_student: sectionStudent }));
    },
);

export default app;
