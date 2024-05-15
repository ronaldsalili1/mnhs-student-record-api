import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import GradeSubmission from '../../models/grade_submission.js';
import Grade from '../../models/grade.js';
import Semester from '../../models/semester.js';
import Section from '../../models/section.js';

import statusCodes from '../../constants/statusCodes.js';
import {
    generateRecordNotExistsReponse,
    generateResponse,
} from '../../helpers/response.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';

import validate from '../../helpers/validator.js';
import { getGradeSubmissionByIdSchema, getGradeSubmissionListSchema, updateGradeSubmissionStatusSchema } from '../../schema/admin/grade_submissions.js';

const app = new Hono().basePath('/grades/submissions');

app.use('*', checkAdminToken);

// GET ENDPOINTS
app.get(
    '/',
    zValidator('query', getGradeSubmissionListSchema, validate),
    async (c) => {
        const {
            page,
            limit,
            status,
            teacher_id,
            start_at,
            end_at,
        } = c.req.valid('query');
        const skip = limit * (page - 1);
        const admin = c.get('admin');

        if (!admin.roles.includes('head_teacher')) {
            return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submissions: [] }));
        }

        const query = {
            admin_id: admin._id,
            ...(status && { status }),
            ...(teacher_id && { teacher_id }),
            ...(start_at && end_at && {
                submitted_at: {
                    $gte: start_at,
                    $lt: end_at,
                },
            }),
        };
        const gradeSubmissions = await GradeSubmission.find(query)
            .limit(limit)
            .skip(skip)
            .populate('teacher_id')
            .populate('semester_id')
            .populate('subject_id')
            .sort({ submitted_at: -1 })
            .lean();

        gradeSubmissions.forEach((gradeSubmission) => {
            gradeSubmission.teacher = gradeSubmission.teacher_id;
            gradeSubmission.semester = gradeSubmission.semester_id;
            gradeSubmission.subject = gradeSubmission.subject_id;

            delete gradeSubmission.teacher.password;
            delete gradeSubmission.teacher_id;
            delete gradeSubmission.semester_id;
            delete gradeSubmission.subject_id;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submissions: gradeSubmissions }));
    },
);

app.get(
    '/:gradeSubmissionId',
    zValidator('param', getGradeSubmissionByIdSchema, validate),
    async (c) => {
        const { gradeSubmissionId } = c.req.valid('param');
        const admin = c.get('admin');

        const gradeSubmission = await GradeSubmission.findOne({
            _id: gradeSubmissionId,
            admin_id: admin._id,
        })
            .populate('teacher_id')
            .lean();
        if (!gradeSubmission) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Grade Submission'));
        }

        const semester = await Semester.findById(gradeSubmission.semester_id).lean();
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Semester'));
        }

        gradeSubmission.teacher = gradeSubmission.teacher_id;
        delete gradeSubmission.teacher_id;
        delete gradeSubmission.teacher.password;

        const subject = await Subject.findById(gradeSubmission.subject_id).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        const section = await Section.findById(gradeSubmission.section_id).lean();
        if (!section) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Section'));
        }

        const grades = await Grade.find({ grade_submission_id: gradeSubmissionId })
            .populate('student_id')
            .lean();

        const students = await Student.find({
            _id: { $in: grades.map((grade) => grade.student_id._id) },
        })
            .sort({ last_name: 1, first_name: 1 })
            .lean();

        grades.forEach((grade) => {
            const student = students.find((student) => (
                student._id.toString() === grade.student_id._id.toString()
            ));

            grade.student = student;
            delete grade.student_id;
        });

        grades.sort((a, b) => {
            let studentA = a.student.last_name;
            let studentB = b.student.last_name;

            if (studentA < studentB) {
                return -1;
            }

            if (studentA > studentB) {
                return 1;
            }

            studentA = a.student.first_name;
            studentB = b.student.first_name;

            if (studentA < studentB) {
                return -1;
            }

            if (studentA > studentB) {
                return 1;
            }

            return 0;
        });

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            semester,
            subject,
            section,
            quarter: gradeSubmission.quarter,
            grade_submission: gradeSubmission,
            student_grade_data: grades,
        }));
    },
);

// PATCH ENDPOINTS
app.patch(
    '/:gradeSubmissionId/update-status',
    zValidator('param', getGradeSubmissionByIdSchema, validate),
    zValidator('json', updateGradeSubmissionStatusSchema, validate),
    async (c) => {
        const { gradeSubmissionId } = c.req.valid('param');
        const { grade_submission: gradeSubmissionBody } = c.req.valid('json');
        const { status } = gradeSubmissionBody;

        const admin = c.get('admin');

        const gradeSubmission = await GradeSubmission.findOne({
            _id: gradeSubmissionId,
            admin_id: admin._id,
            ...(status === 'under_review' && { status: 'pending' }),
            ...((status === 'approved' || status === 'rejected') && { status: { $in: ['under_review', 'pending'] } }),
        });
        if (!gradeSubmission) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Grade Submission'));
        }

        gradeSubmission.status = status;

        if (status === 'under_review') {
            gradeSubmission.marked_under_review_at = new Date();
        }

        if (status === 'rejected') {
            gradeSubmission.marked_rejected_at = new Date();
        }

        if (status === 'approved') {
            gradeSubmission.marked_approved_at = new Date();
        }

        gradeSubmission.updated_by = admin._id;

        gradeSubmission.save();

        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submission: gradeSubmission }));
    },
);

export default app;
