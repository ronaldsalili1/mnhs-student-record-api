import dayjs from 'dayjs';
import ExcelJS from 'exceljs';

import { track, strand } from './label.js';

const templatePath = 'src/forms/shs_sf10.xlsx';

/**
 * @typedef {Object} FormSubject
 * @property {string} type
 * @property {string} name
 */

/**
 * Get the subjects based on specified sheet and rows
 * @param {string} worksheetName
 * @param {number} rowStart
 * @param {number} rowEnd
 * @returns {FormSubject[]}
 */
export const getSubjectNames = async (worksheetName, rowStart, rowEnd) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet(worksheetName);

    /**
     * Determine grade level, sy, sem and section based on
     * the subject specified in the excel file.
     */
    const col = worksheet.getColumn(1);
    const formSubjects = [];
    col.eachCell((cell, rowNumber) => {
        if (rowNumber >= rowStart && rowNumber <= rowEnd) {
            const nameCell = worksheet.getCell(`I${rowNumber}`);
            const subject = {
                type: cell.value.toLowerCase().trim(),
                name: nameCell.value.toLowerCase().trim(),
            };
            formSubjects.push(subject);
        }
    });

    return formSubjects;
};

/**
 * Set the data for Learner's Information Section
 * @param {ExcelJS.Worksheet} worksheet
 * @param {Object} student
 */
export const setStudentInfoData = (worksheet, student) => {
    // Last Name
    let cell = worksheet.getCell('F8');
    cell.value = student.last_name.toUpperCase();

    // First Name
    cell = worksheet.getCell('Y8');
    cell.value = `${student.first_name.toUpperCase()}${student?.suffix ? ` ${student.suffix.toUpperCase()}` : ''}`;

    // Middle Name
    if (student.middle_name) {
        cell = worksheet.getCell('AZ8');
        cell.value = student.middle_name.toUpperCase();
    }

    // LRN
    cell = worksheet.getCell('C9');
    cell.value = student.lrn;

    // Date of Birth
    cell = worksheet.getCell('AA9');
    cell.value = dayjs(student.birthdate).format('MM/DD/YYYY');

    // Sex
    cell = worksheet.getCell('AN9');
    cell.value = student.sex.toUpperCase();

    // Date of SHS Admission
    if (student.shs_admission_date) {
        cell = worksheet.getCell('BH9');
        cell.value = dayjs(student.shs_admission_date).format('MM/DD/YYYY');
    }
};

/**
 * Set the data for Eligibility for SHS Enrollment Section
 * @param {ExcelJS.Worksheet} worksheet
 * @param {Object} studentShsEligibility
 */
export const setShsEligibilityData = (worksheet, studentShsEligibility) => {
    // High School Completer
    let cell = worksheet.getCell('A13');
    cell.value = studentShsEligibility.hs_completer ? '⁄' : '';

    // High School Completer Gen Ave
    cell = worksheet.getCell('N13');
    cell.value = studentShsEligibility.hs_gen_avg ? studentShsEligibility.hs_gen_avg : '';

    // Junior High School Completer
    cell = worksheet.getCell('S13');
    cell.value = studentShsEligibility.jhs_completer ? '⁄' : '';

    // Junior High School Completer Gen Ave
    cell = worksheet.getCell('AH13');
    cell.value = studentShsEligibility.jhs_gen_avg ? studentShsEligibility.jhs_gen_avg : '';

    // Date of Graduation/Completion
    cell = worksheet.getCell('O14');
    cell.value = studentShsEligibility.completion_date ? dayjs(studentShsEligibility.completion_date).format('MM/DD/YYYY') : '';

    // Name of School
    cell = worksheet.getCell('Z14');
    cell.value = studentShsEligibility.school_name ? studentShsEligibility.school_name.toUpperCase() : '';

    // School Address
    cell = worksheet.getCell('AW14');
    cell.value = studentShsEligibility.school_address ? studentShsEligibility.school_address.toUpperCase() : '';

    // PEPT Passer
    cell = worksheet.getCell('A16');
    cell.value = studentShsEligibility.pept_passer ? '⁄' : '';

    // PEPT Rating
    cell = worksheet.getCell('K16');
    cell.value = studentShsEligibility.pept_rating ? studentShsEligibility.pept_rating : '';

    // ALS Passer
    cell = worksheet.getCell('S16');
    cell.value = studentShsEligibility.als_ae_passer ? '⁄' : '';

    // PEPT Rating
    cell = worksheet.getCell('AC16');
    cell.value = studentShsEligibility.als_ae_rating ? studentShsEligibility.als_ae_rating : '';

    if (studentShsEligibility.others) {
        cell = worksheet.getCell('AH16');
        cell.value = '⁄';

        cell = worksheet.getCell('AP16');
        cell.value = studentShsEligibility.others.toUpperCase();
    }

    // Date of Examination
    cell = worksheet.getCell('P17');
    cell.value = studentShsEligibility.assesment_date ? dayjs(studentShsEligibility.assesment_date).format('MM/DD/YYYY') : '';

    // Name and Address of Community Learning Center
    cell = worksheet.getCell('AN17');
    cell.value = studentShsEligibility.clc_name_address ? studentShsEligibility.clc_name_address.toUpperCase() : '';
};

/**
 * Set the data for header part of Sholastic Record Sections
 * @param {ExcelJS.Worksheet} worksheet
 * @param {Object} school
 * @param {Object} student
 * @param {Object} [sectionStudent]
 * @param {number} firstRow
 * @param {number} secondRow
 */
export const setGradesHeaderSectionData = (
    worksheet,
    school,
    student,
    sectionStudent,
    firstRow,
    secondRow,
) => {
    const {
        grade_level_snapshot,
        sy_start_snapshot,
        sy_end_snapshot,
        semester_term_snapshot,
        section_name_snapshot,
    } = sectionStudent;

    // School
    let cell = worksheet.getCell(`E${firstRow}`);
    cell.value = school.name.toUpperCase();

    // School ID
    cell = worksheet.getCell(`AF${firstRow}`);
    cell.value = school.school_id;

    // Track / Strand
    cell = worksheet.getCell(`G${secondRow}`);
    cell.value = `${track(student.track).toUpperCase()}/${strand(student.strand).toUpperCase()}`;

    if (sectionStudent) {
        // Grade Level
        cell = worksheet.getCell(`AS${firstRow}`);
        cell.value = grade_level_snapshot;

        // SY
        cell = worksheet.getCell(`BA${firstRow}`);
        cell.value = `${sy_start_snapshot}-${sy_end_snapshot}`;

        // Sem
        cell = worksheet.getCell(`BK${firstRow}`);
        cell.value = semester_term_snapshot === 1 ? '1ST' : '2ND';

        // Section
        cell = worksheet.getCell(`AS${secondRow}`);
        cell.value = section_name_snapshot.toUpperCase();
    }
};

/**
 * Set the data for grades section
 * @param {ExcelJS.Worksheet} worksheet
 * @param {Object} grade
 * @param {number} rowNumber
 */
export const setGradeData = (worksheet, grade, rowNumber) => {
    const { quarter_1, quarter_2 } = grade || {};

    let cell = worksheet.getCell(`AT${rowNumber}`);
    cell.value = quarter_1 || '';

    cell = worksheet.getCell(`AY${rowNumber}`);
    cell.value = quarter_2 || '';

    if (quarter_1 && quarter_2) {
        const average = Math.round((quarter_1 + quarter_2) / 2);
        cell = worksheet.getCell(`BD${rowNumber}`);
        cell.value = average;

        cell = worksheet.getCell(`BI${rowNumber}`);
        cell.value = average >= 75 ? 'PASSED' : 'FAILED';
    }
};
