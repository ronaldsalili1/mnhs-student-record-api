import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Student from '../../models/student.js';
import SectionStudent from '../../models/section_student.js';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import { generateRecordExistsReponse, generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';
import { getStudentOptionsSchema } from '../../schema/admin/students.js';
import validate from '../../helpers/validator.js';

const app = new Hono().basePath('/students');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const {
            page = 1,
            limit = 10,
            sex,
            keyword,
        } = c.req.query();
        const skip = limit * (page - 1);
        const query = {
            ...(sex && { sex }),
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

        const total = await Student.countDocuments(query);
        const students = await Student.find(query)
            .limit(limit)
            .skip(skip)
            .sort({ last_name: 1 })
            .lean();

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

app.get(
    '/:studentId',
    async (c) => {
        const id = c.req.param('studentId');

        // Find student
        const student = await Student.findById(id).lean();
        if (!student) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { student }));
    },
);
app.get('/options/all', async (c) => {
    const students = await Student.find().sort({ last_name: 1 }).lean();

    return c.json(generateResponse(statusCodes.OK, 'Success', { students }));
});

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { student: studentBody } = await c.req.json();
        const {
            email,
            guardian_email,
            last_name,
            first_name,
            middle_name,
            suffix,
            lrn,
            birthdate,
            sex,
            shs_admission_date,
            strand,
            track,
            shs_graduation_date,
        } = studentBody;

        // Check if email already used by other student
        if (email) {
            const studentEmailExist = await Student.exists({ email });
            if (studentEmailExist) {
                c.status(statusCodes.CONFLICT);
                return c.json(generateRecordExistsReponse('Student with the same email'));
            }
        }

        // Check if LRN is already used
        const studentLrnExist = await Student.exists({ lrn });
        if (studentLrnExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Student with the same LRN'));
        }

        const newStudent = new Student();
        newStudent.email = email;
        newStudent.guardian_email = guardian_email;
        newStudent.last_name = last_name;
        newStudent.first_name = first_name;
        newStudent.middle_name = middle_name;
        newStudent.suffix = suffix;
        newStudent.lrn = lrn;
        newStudent.birthdate = birthdate;
        newStudent.sex = sex;
        newStudent.shs_admission_date = shs_admission_date;
        newStudent.strand = strand;
        newStudent.track = track;
        newStudent.shs_graduation_date = shs_graduation_date;
        newStudent.created_by = admin._id;

        await newStudent.save();

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { student: newStudent }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:studentId',
    async (c) => {
        const admin = c.get('admin');
        const id = c.req.param('studentId');
        const { student: studentBody } = await c.req.json();
        const {
            email,
            guardian_email,
            last_name,
            first_name,
            middle_name,
            suffix,
            lrn,
            birthdate,
            sex,
            shs_admission_date,
            strand,
            track,
            shs_graduation_date,
        } = studentBody;

        // Check if email already used by other student
        if (email) {
            const studentEmailExist = await Student.exists({ _id: { $ne: id }, email });
            if (studentEmailExist) {
                c.status(statusCodes.CONFLICT);
                return c.json(generateRecordExistsReponse('Student with the same email'));
            }
        }

        // Check if LRN is already used
        const studentLrnExist = await Student.exists({ _id: { $ne: id }, lrn });
        if (studentLrnExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateRecordExistsReponse('Student with the same LRN'));
        }

        // Find student
        const student = await Student.findById(id);
        if (!student) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student'));
        }

        student.email = email;
        student.guardian_email = guardian_email;
        student.last_name = last_name;
        student.first_name = first_name;
        student.middle_name = middle_name;
        student.suffix = suffix;
        student.lrn = lrn;
        student.birthdate = birthdate;
        student.sex = sex;
        student.shs_admission_date = shs_admission_date;
        student.strand = strand;
        student.track = track;
        student.shs_graduation_date = shs_graduation_date;
        student.updated_by = admin._id;

        await student.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { student }));
    },
);

export default app;
