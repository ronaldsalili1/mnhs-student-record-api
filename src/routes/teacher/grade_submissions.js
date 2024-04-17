import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import ExcelJS from 'exceljs';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import Semester from '../../models/semester.js';
import SubjectStudent from '../../models/subject_student.js';
import GradeSubmission from '../../models/grade_submission.js';
import Grade from '../../models/grade.js';
import Admin from '../../models/admin.js';

import statusCodes from '../../constants/statusCodes.js';
import {
    generateInternalServerError,
    generateRecordExistsReponse,
    generateRecordNotExistsReponse,
    generateResponse,
} from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

import validate from '../../helpers/validator.js';
import { capitalizeFirstLetter, formatFullName, generateRandomString } from '../../helpers/general.js';
import { getGradeSubmissionByIdSchema, getGradeSubmissionListSchema, gradeSubmissionSchema } from '../../schema/teacher/grade_submissions.js';

const app = new Hono().basePath('/grades/submissions');

app.use('*', checkTeacherToken);

// GET ENDPOINTS
app.get(
    '/',
    zValidator('query', getGradeSubmissionListSchema, validate),
    async (c) => {
        const { page, limit } = c.req.valid('query');
        const skip = limit * (page - 1);
        const teacher = c.get('teacher');
        const query = {
            teacher_id: teacher._id,
        };

        const gradeSubmissions = await GradeSubmission.find(query)
            .limit(limit)
            .skip(skip)
            .populate('admin_id')
            .populate('semester_id')
            .populate('subject_id')
            .sort({ submitted_at: -1 })
            .lean();

        gradeSubmissions.forEach((gradeSubmission) => {
            gradeSubmission.reviewer = gradeSubmission.admin_id;
            gradeSubmission.semester = gradeSubmission.semester_id;
            gradeSubmission.subject = gradeSubmission.subject_id;

            delete gradeSubmission.reviewer.password;
            delete gradeSubmission.admin_id;
            delete gradeSubmission.semester_id;
            delete gradeSubmission.subject_id;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submissions: gradeSubmissions }));
    },
);

app.get(
    '/:gradeSubmissionId',
    zValidator('param', getGradeSubmissionByIdSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { gradeSubmissionId } = c.req.valid('param');
        const semester = c.get('semester');

        const gradeSubmission = await GradeSubmission.findById(gradeSubmissionId)
            .populate('admin_id')
            .lean();
        if (!gradeSubmission) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Grade Submission'));
        }

        gradeSubmission.reviewer = gradeSubmission.admin_id;
        delete gradeSubmission.admin_id;
        delete gradeSubmission.reviewer.password;

        const subject = await Subject.findById(gradeSubmission.subject_id).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        const grades = await Grade.find({ grade_submission_id: gradeSubmissionId })
            .populate('subject_student_id')
            .lean();

        const students = await Student.find({
            _id: { $in: grades.map((grade) => grade.subject_student_id.student_id) },
        }).lean();

        grades.forEach((grade) => {
            const student = students.find((student) => (
                student._id.toString() === grade.subject_student_id.student_id.toString()
            ));

            grade.student = student;
            delete grade.subject_student_id;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            semester,
            subject,
            grade_submission: gradeSubmission,
            student_grade_data: grades,
        }));
    },
);

// POST ENDPOINTS
app.post(
    '/',
    zValidator('json', gradeSubmissionSchema, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const semester = c.get('semester');
        const { grade_submission: gradeSubmissionBody } = c.req.valid('json');
        const {
            admin_id,
            subject_id,
            remark,
            grades,
        } = gradeSubmissionBody;

        const admin = await Admin.exists({ _id: admin_id });
        if (!admin) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Admin'));
        }

        const subject = await Subject.exists({ _id: subject_id });
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        // Check if the teacher already submitted the grade
        const gradeSubmissionExist = await GradeSubmission.exists({
            semester_id: semester._id,
            subject_id,
            teacher_id: teacher._id,
        });
        if (gradeSubmissionExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(statusCodes.CONFLICT, 'The grades for this subject have already been submitted.'));
        }

        // Create grade submission
        const gradeSubmission = await GradeSubmission.create({
            admin_id,
            semester_id: semester._id,
            subject_id,
            teacher_id: teacher._id,
            status: 'pending',
            submitted_at: new Date(),
            remark,
            created_by: teacher._id,
        });

        const subjectStudents = await SubjectStudent.find({
            subject_id,
            semester_id: semester._id,
            student_id: { $in: grades.map((grade) => grade.student_id) },
        }).lean();

        // Create grades
        await Grade.insertMany(grades.map((grade) => {
            const { quarter_1, quarter_2 } = grade || {};
            const subjectStudent = subjectStudents.find((subjectStudent) => (
                subjectStudent.student_id.toString() === grade.student_id
            ));

            return {
                grade_submission_id: gradeSubmission._id,
                subject_student_id: subjectStudent._id,
                quarter_1,
                quarter_2,
                created_by: teacher._id,
            };
        }));

        c.status(statusCodes.CREATED);
        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submission: gradeSubmission }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:gradeSubmissionId',
    zValidator('param', getGradeSubmissionByIdSchema, validate),
    zValidator('json', gradeSubmissionSchema, validate),
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const semester = c.get('semester');
        const { gradeSubmissionId } = c.req.valid('param');
        const { grade_submission: gradeSubmissionBody } = c.req.valid('json');
        const {
            admin_id,
            subject_id,
            remark,
            grades,
        } = gradeSubmissionBody;

        const gradeSubmission = await GradeSubmission.findById(gradeSubmissionId);
        if (!gradeSubmission) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Grade Submission'));
        }

        const admin = await Admin.exists({ _id: admin_id });
        if (!admin) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Admin'));
        }

        const subject = await Subject.exists({ _id: subject_id });
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        // Check if the teacher already submitted the grade
        const gradeSubmissionExist = await GradeSubmission.exists({
            _id: { $ne: gradeSubmissionId },
            semester_id: semester._id,
            subject_id,
            teacher_id: teacher._id,
        });
        if (gradeSubmissionExist) {
            c.status(statusCodes.CONFLICT);
            return c.json(generateResponse(statusCodes.CONFLICT, 'The grades for this subject have already been submitted.'));
        }

        // Update grade submission
        gradeSubmission.admin_id = admin_id;
        gradeSubmission.remark = remark;
        gradeSubmission.updated_by = teacher._id;
        await gradeSubmission.save();

        const subjectStudents = await SubjectStudent.find({
            subject_id,
            semester_id: semester._id,
            student_id: { $in: grades.map((grade) => grade.student_id) },
        }).lean();

        // Delete all grades under gradeSubmissionId
        await Grade.deleteMany({ grade_submission_id: gradeSubmissionId });

        // Create grades
        await Grade.insertMany(grades.map((grade) => {
            const { quarter_1, quarter_2 } = grade || {};
            const subjectStudent = subjectStudents.find((subjectStudent) => (
                subjectStudent.student_id.toString() === grade.student_id
            ));

            return {
                grade_submission_id: gradeSubmission._id,
                subject_student_id: subjectStudent._id,
                quarter_1,
                quarter_2,
                created_by: teacher._id,
            };
        }));

        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submission: gradeSubmission }));
    },
);

export default app;
