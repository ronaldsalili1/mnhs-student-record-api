import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import SubjectStudent from '../../models/subject_student.js';
import GradeSubmission from '../../models/grade_submission.js';
import Grade from '../../models/grade.js';
import Admin from '../../models/admin.js';

import statusCodes from '../../constants/statusCodes.js';
import {
    generateRecordNotExistsReponse,
    generateResponse,
} from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

import validate from '../../helpers/validator.js';
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

            if (gradeSubmission.quarter === 1) {
                grade.grade = grade.quarter_1;
            } else if (gradeSubmission.quarter === 2) {
                grade.grade = grade.quarter_2;
            }

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
            quarter: gradeSubmission.quarter,
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
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        const { grade_submission: gradeSubmissionBody } = c.req.valid('json');
        const {
            admin_id,
            subject_id,
            remark,
            grades,
            quarter,
        } = gradeSubmissionBody;

        const admin = await Admin.exists({ _id: admin_id });
        if (!admin) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Admin'));
        }

        const subject = await Subject.findById(subject_id).lean();
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
            quarter,
            status: 'pending',
            submitted_at: new Date(),
            remark,
            created_by: teacher._id,
        });

        const subjectStudents = await SubjectStudent.find({
            subject_id,
            semester_id: semester._id,
            student_id: {
                $in: grades.map((grade) => grade.student_id),
            },
        }).lean();
        // eslint-disable-next-line max-len
        const subjectStudentIds = subjectStudents.map((subjectStudent) => subjectStudent._id.toString());

        // Create grades and subjectStudents
        const newSubjectStudents = [];
        await Grade.insertMany(grades.map((grade) => {
            const { grade: gradeVal, student_id } = grade || {};

            if (!subjectStudentIds.includes(student_id)) {
                newSubjectStudents.push({
                    subject_id,
                    semester_id: semester._id,
                    student_id,
                    subject_name_snapshot: subject.name,
                    subject_type_snapshot: subject.type,
                    sy_start_snapshot: semester.sy_start_year,
                    sy_end_snapshot: semester.sy_end_year,
                    semester_term_snapshot: semester.term,
                    created_by: teacher._id,
                });
            }

            return {
                grade_submission_id: gradeSubmission._id,
                subject_id,
                semester_id: semester._id,
                student_id,
                ...(quarter === 1 && { quarter_1: gradeVal }),
                ...(quarter === 2 && { quarter_2: gradeVal }),
                created_by: teacher._id,
            };
        }));

        await SubjectStudent.insertMany(newSubjectStudents);

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
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

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

        // Delete all grades under gradeSubmissionId
        await Grade.deleteMany({ grade_submission_id: gradeSubmissionId });

        // Create grades
        const { quarter } = gradeSubmission || {};
        await Grade.insertMany(grades.map((grade) => {
            const { grade: gradeVal, student_id } = grade || {};

            return {
                grade_submission_id: gradeSubmission._id,
                subject_id,
                semester_id: semester._id,
                student_id,
                ...(quarter === 1 && { quarter_1: gradeVal }),
                ...(quarter === 2 && { quarter_2: gradeVal }),
                created_by: teacher._id,
            };
        }));

        return c.json(generateResponse(statusCodes.OK, 'Success', { grade_submission: gradeSubmission }));
    },
);

export default app;
