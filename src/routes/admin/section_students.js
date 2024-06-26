import { Hono } from 'hono';

// Models
import Semester from '../../models/semester.js';
import SectionStudent from '../../models/section_student.js';
import Student from '../../models/student.js';
import Section from '../../models/section.js';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import statusCodes from '../../constants/statusCodes.js';

const app = new Hono().basePath('/section-students');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    async (c) => {
        const {
            page = 1,
            limit = 10,
            section_id,
            semester_id,
        } = c.req.query();
        const skip = limit * (page - 1);

        const semester = await Semester.findOne({ status: 'active' }).lean();
        const query = {
            ...(semester && { semester_id: semester._id }),
            ...(section_id && { section_id }),
            ...(semester_id && { semester_id }),
        };

        const total = await SectionStudent.countDocuments(query);
        const sectionStudents = await SectionStudent.find(query)
            .limit(limit)
            .skip(skip)
            .populate('student_id')
            .populate('semester_id')
            .sort({ 'student_id.last_name': 1 })
            .lean();

        // eslint-disable-next-line arrow-parens
        sectionStudents.forEach(sectionStudent => {
            sectionStudent.student = sectionStudent.student_id;
            delete sectionStudent.student_id;

            sectionStudent.semester = sectionStudent.semester_id;
            delete sectionStudent.semester_id;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            total,
            page,
            limit,
            count: sectionStudents.length,
            section_students: sectionStudents,
        }));
    },
);
app.get(
    '/options/students',
    async (c) => {
        const {
            section_id,
            semester_id,
        } = c.req.query();

        // Get sections students
        const sectionStudents = await SectionStudent.find({ section_id, semester_id }).lean();

        // Get student options
        const students = await Student
            .find({
                _id: {
                    $nin: sectionStudents.map((sectionStudent) => sectionStudent.student_id),
                },
            })
            .sort({ last_name: 1 })
            .lean();

        return c.json(generateResponse(statusCodes.OK, 'Success', { students }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    async (c) => {
        const admin = c.get('admin');
        const { section_students: sectionStudentsBody } = await c.req.json();
        const {
            section_id,
            semester_id,
            student_ids,
        } = sectionStudentsBody;

        // Check for duplicates
        const sectionStudentExist1 = await SectionStudent.exists({
            section_id,
            semester_id,
            student_id: { $in: student_ids || [] },
        }).lean();
        if (sectionStudentExist1) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(409, 'Student already exist in this section'));
        }

        const sectionStudentExist2 = await SectionStudent.exists({
            semester_id,
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

        // Get semester
        const semester = await Semester.findById(semester_id).lean();
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Semester'));
        }

        const sectionStudents = student_ids.map((studentId) => ({
            section_id,
            semester_id,
            student_id: studentId,
            section_name_snapshot: section.name,
            grade_level_snapshot: section.grade_level,
            sy_start_snapshot: semester.sy_start_year,
            sy_end_snapshot: semester.sy_end_year,
            semester_term_snapshot: semester.term,
            created_by: admin._id,
        }));

        await SectionStudent.insertMany(sectionStudents);

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

// DELETE ENDPOINTS
app.delete(
    '/:sectionStudentId',
    async (c) => {
        const id = c.req.param('sectionStudentId');

        const sectionStudent = await SectionStudent.findByIdAndDelete(id);
        if (!sectionStudent) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student'));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', { section_student: sectionStudent }));
    },
);

export default app;
