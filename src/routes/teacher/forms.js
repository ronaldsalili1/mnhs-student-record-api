import { Hono } from 'hono';
import dayjs from 'dayjs';
import { zValidator } from '@hono/zod-validator';
import ExcelJS from 'exceljs';
import slugify from 'slugify';

// Models
import Subject from '../../models/subject.js';
import SubjectStudent from '../../models/subject_student.js';
import Student from '../../models/student.js';
import StudentShsEligibility from '../../models/student_shs_eligibility.js';
import School from '../../models/school.js';
import SectionStudent from '../../models/section_student.js';
import SectionAdviser from '../../models/section_adviser.js';
import GradeSubmission from '../../models/grade_submission.js';
import Grade from '../../models/grade.js';

import statusCodes from '../../constants/statusCodes.js';
import { generateRecordNotExistsReponse, generateResponse } from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import { getSubjectListSchema, getSubjectByIdSchema } from '../../schema/teacher/subjects.js';
import validate from '../../helpers/validator.js';
import { getFormByStudentIdSchema } from '../../schema/teacher/forms.js';
import { track, strand } from '../../helpers/label.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import { setStudentInfoData, setShsEligibilityData, setGradesHeaderSectionData, setGradeData } from '../../helpers/shs_form_10.js';

const app = new Hono().basePath('/forms');

app.use('*', checkTeacherToken);

app.get(
    '/:form/:studentId',
    zValidator('param', getFormByStudentIdSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { form, studentId } = c.req.valid('param');

        // Get necessary data
        const student = await Student.findById(studentId).lean();
        if (!student) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Student'));
        }

        // Validate if the teacher is allowed to generate the forms
        const teacher = c.get('teacher');
        const now = dayjs().toDate();
        const sectionAdviser = await SectionAdviser.findOne({
            teacher_id: teacher._id,
            start_at: { $lte: now },
            $or: [
                { end_at: { $gt: now } },
                { end_at: { $exists: false } },
            ],
        }).lean();
        if (!sectionAdviser) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'Only the section advisers are allowed to generate forms'));
        }

        const semester = c.get('semester');
        let sectionStudent = await SectionStudent.findOne({
            section_id: sectionAdviser.section_id,
            student_id: student._id,
            semester_id: semester?._id,
        }).lean();
        if (!sectionStudent) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'Forms cannot be generated for students who are not currently in your section'));
        }

        const school = await School.findOne().lean();
        if (!school) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('School'));
        }

        let templatePath;
        if (form === 'sf10') {
            templatePath = 'src/forms/shs_sf10.xlsx';
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        const worksheet = workbook.getWorksheet('FRONT');

        // LEARNER'S INFORMATION SECTION
        setStudentInfoData(worksheet, student);

        // ELIGIBILITY FOR SHS ENROLMENT SECTION
        const studentShsEligibility = await StudentShsEligibility.findOne({
            student_id: student._id,
        }).lean();
        if (studentShsEligibility) {
            setShsEligibilityData(worksheet, studentShsEligibility);
        }

        // SCHOLASTIC RECORD SECTION

        /**
         * Determine grade level, sy, sem and section based on
         * the subject specified in the excel file.
         */
        const col = worksheet.getColumn(1);
        const formSubjects = [];
        col.eachCell((cell, rowNumber) => {
            if (rowNumber >= 31 && rowNumber <= 39) {
                const nameCell = worksheet.getCell(`I${rowNumber}`);
                const subject = {
                    type: cell.value.toLowerCase().trim(),
                    name: nameCell.value.toLowerCase().trim(),
                };
                formSubjects.push(subject);
            }
        });

        const subjectNames = formSubjects.map((subject) => subject.name);
        const subjects = await Subject.find({
            name: {
                $regex: subjectNames.join('|'), $options: 'i',
            },
        }).lean();

        const subjectStudents = await SubjectStudent.findOne({
            subject_id: {
                $in: subjects.map((subject) => subject._id),
            },
            student_id: student._id,
        }).lean();

        sectionStudent = undefined;
        if (subjectStudents) {
            sectionStudent = await SectionStudent.findOne({
                semester_id: subjectStudents.semester_id,
                student_id: student._id,
            }).lean();
        }

        setGradesHeaderSectionData(worksheet, school, student, sectionStudent, 23, 25);

        const gradeSubmissions = await GradeSubmission.find({
            semester_id: subjectStudents?.semester_id,
            subject_id: { $in: subjects.map((subject) => subject._id) },
            status: 'approved',
        }).lean();
        const grades = await Grade.find({
            grade_submission_id: {
                $in: gradeSubmissions.map((gradeSubmission) => gradeSubmission._id),
            },
            subject_id: { $in: subjects.map((subject) => subject._id) },
            student_id: student._id,
        })
            .populate('subject_id')
            .lean();

        col.eachCell((_, rowNumber) => {
            if (rowNumber >= 31 && rowNumber <= 39) {
                const nameCell = worksheet.getCell(`I${rowNumber}`);
                const subjectName = nameCell.value.toLowerCase().trim();

                const grade = grades.find((grade) => {
                    const gradeSubjName = grade.subject_id.name.toLowerCase().trim();

                    if (gradeSubjName.includes(subjectName)) {
                        return true;
                    }

                    return false;
                });

                if (grade) {
                    setGradeData(worksheet, grade, rowNumber);
                }
            }
        });

        // eslint-disable-next-line prefer-template
        const filename = form.toUpperCase()
            + '_'
            + slugify(student.last_name, '_')
            + '_'
            + slugify(student.first_name, '_');

        // Set appropriate response headers for Excel download
        c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        c.header('Content-Disposition', `attachment; filename=${filename}.xlsx`);

        const buffer = await workbook.xlsx.writeBuffer();

        return c.body(buffer);
    },
);

export default app;
