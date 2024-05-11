import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import ExcelJS from 'exceljs';
import slugify from 'slugify';
import dayjs from 'dayjs';

// Models
import Student from '../../models/student.js';
import Subject from '../../models/subject.js';
import SectionAdviser from '../../models/section_adviser.js';
import SectionStudent from '../../models/section_student.js';

import statusCodes from '../../constants/statusCodes.js';
import {
    generateInternalServerError,
    generateRecordNotExistsReponse,
    generateResponse,
} from '../../helpers/response.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

import validate from '../../helpers/validator.js';
import { capitalizeFirstLetter, formatFullName, generateRandomString } from '../../helpers/general.js';
import { downloadTemplateSchema } from '../../schema/teacher/grades.js';

const app = new Hono().basePath('/grades');

app.use('*', checkTeacherToken);

app.get(
    '/download/template',
    zValidator('query', downloadTemplateSchema, validate),
    checkActiveSemester,
    async (c) => {
        const { subject_id, section_id, quarter } = c.req.valid('query');

        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        // Get necessary data
        const subject = await Subject.findById(subject_id).lean();
        if (!subject) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Subject'));
        }

        // Find teacher section
        const teacher = c.get('teacher');
        const now = dayjs();
        const sectionAdviserQuery = {
            $and: [
                { section_id },
                { teacher_id: teacher._id },
                { start_at: { $lte: now.toDate() } },
                {
                    $or: [
                        { end_at: null },
                        { end_at: { $exists: false } },
                        { end_at: { $gt: now.toDate() } },
                    ],
                },
            ],
        };
        const sectionAdviser = await SectionAdviser.findOne(sectionAdviserQuery).lean();
        if (!sectionAdviser) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(statusCodes.NOT_FOUND, 'You are currently not an adviser of the selected section.'));
        }

        // Get students in the section
        const sectionStudentQuery = {
            semester_id: semester._id,
            section_id,
        };
        const sectionStudents = await SectionStudent.find(sectionStudentQuery)
            .lean();

        const students = await Student.find({
            _id: {
                $in: sectionStudents.map((sectionStudent) => sectionStudent.student_id),
            },
        })
            .sort({ last_name: 1, first_name: 1 })
            .lean();

        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'MNHS Student Records System';
        workbook.created = new Date();

        let worksheet = workbook.addWorksheet('Information');

        let col = worksheet.getColumn(1);
        col.width = 15;

        let cell = worksheet.getCell('A1');
        cell.value = 'Subject ID:';

        cell = worksheet.getCell('A2');
        cell.value = 'Subject Name:';

        cell = worksheet.getCell('A3');
        cell.value = 'Subject Type:';

        cell = worksheet.getCell('A4');
        cell.value = 'School Year:';

        cell = worksheet.getCell('A5');
        cell.value = 'Semester:';

        cell = worksheet.getCell('A6');
        cell.value = 'Quarter:';

        col = worksheet.getColumn(2);
        col.width = 25;
        col.alignment = { horizontal: 'left' };

        cell = worksheet.getCell('B1');
        cell.value = subject._id.toString();

        cell = worksheet.getCell('B2');
        cell.value = subject.name;

        cell = worksheet.getCell('B3');
        cell.value = capitalizeFirstLetter(subject.type);

        cell = worksheet.getCell('B4');
        cell.value = `S.Y. ${semester.sy_start_year} - ${semester.sy_end_year}`;

        cell = worksheet.getCell('B5');
        cell.value = semester.term;

        cell = worksheet.getCell('B6');
        cell.value = quarter;

        await worksheet.protect(generateRandomString());

        worksheet = workbook.addWorksheet('Grades', { views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }] });

        cell = worksheet.getCell('A1');
        cell.value = 'LRN';

        cell = worksheet.getCell('B1');
        cell.value = 'Name';

        cell = worksheet.getCell('C1');
        cell.value = 'Grade';

        const row = worksheet.getRow(1);
        row.alignment = { horizontal: 'center', vertical: 'middle' };
        row.font = { bold: true };

        for (let i = 0; i < students.length; i++) {
            const student = students[i];

            cell = worksheet.getCell(`A${i + 2}`);
            cell.value = student.lrn;

            cell = worksheet.getCell(`B${i + 2}`);
            cell.value = formatFullName(student);
        }

        col = worksheet.getColumn(1);
        col.width = 25;

        col = worksheet.getColumn(2);
        col.width = 35;

        col = worksheet.getColumn(3);
        col.eachCell((cell, rowNumber) => {
            if (rowNumber > 1) {
                cell.protection = { locked: false };
            }
        });

        col = worksheet.getColumn(4);
        col.eachCell((cell, rowNumber) => {
            if (rowNumber > 1) {
                cell.protection = { locked: false };
            }
        });

        await worksheet.protect(generateRandomString());

        // Set appropriate response headers for Excel download
        c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        c.header('Content-Disposition', `attachment; filename=${slugify(subject.name.toLowerCase())}-quarter${quarter}-template.xlsx`);

        const buffer = await workbook.xlsx.writeBuffer();

        return c.body(buffer);
    },
);

// POST ENDPOINTS
app.post(
    '/upload',
    checkActiveSemester,
    async (c) => {
        const { file } = await c.req.parseBody();
        const semester = c.get('semester');
        if (!semester) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateResponse(
                statusCodes.NOT_FOUND,
                'There is no active semester at the moment',
            ));
        }

        const studentGradeData = [];
        let subject;
        let cell;
        let quarter;
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.read(file.stream());

            let worksheet = workbook.getWorksheet('Information');

            cell = worksheet.getCell('B1');
            const subjectId = cell.value;

            cell = worksheet.getCell('B6');
            quarter = cell.value;

            subject = await Subject.findById(subjectId).lean();
            if (!subject) {
                c.status(statusCodes.NOT_FOUND);
                return c.json(generateRecordNotExistsReponse('Student'));
            }

            // Read the data in the excel file
            worksheet = workbook.getWorksheet('Grades');
            const col = worksheet.getColumn(1);
            const studentLrns = [];
            col.eachCell((cell, rowNumber) => {
                if (rowNumber > 1) {
                    studentLrns.push(cell.value);
                }
            });

            const students = await Student.find({ lrn: { $in: studentLrns } })
                .sort({ last_name: 1 })
                .lean();

            col.eachCell((cell, rowNumber) => {
                if (rowNumber > 1) {
                    const lrn = cell.value;
                    const grade = worksheet.getCell(`C${rowNumber}`).value;

                    const student = students.find((student) => student.lrn === lrn);

                    studentGradeData.push({
                        _id: generateRandomString(),
                        student,
                        ...(Number.isInteger(grade) && { grade }),
                    });
                }
            });
        } catch (error) {
            console.error(error);
            c.json(statusCodes.INTERNAL_SERVER_ERROR);
            return c.json(generateInternalServerError(error.message));
        }

        return c.json(generateResponse(statusCodes.OK, 'Success', {
            semester,
            subject,
            quarter,
            student_grade_data: studentGradeData,
        }));
    },
);

export default app;
