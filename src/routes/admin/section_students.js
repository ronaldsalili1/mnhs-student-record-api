import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
// import {
//     createSectionAdviser,
//     getSectionAdviserById,
//     getSectionAdvisers,
//     updateSectionAdviserById,
// } from '../../controllers/admin/section_advisers.js';
import {
    createSectionStudent,
    deleteSectionStudentById,
    getSectionStudents,
    getStudentOptions,
} from '../../controllers/admin/section_students.js';

const sectionStudents = new Hono().basePath('/admin/section-students');

sectionStudents.use('*', checkAdminToken);

sectionStudents.get('/', getSectionStudents);
// sectionStudents.get('/:sectionAdviserId', getSectionAdviserById);
sectionStudents.post('/', createSectionStudent);
// sectionStudents.patch('/:sectionAdviserId', updateSectionAdviserById);
sectionStudents.delete('/:sectionStudentId', deleteSectionStudentById);

// Speacial Endpoint
sectionStudents.get('/options/students', getStudentOptions);

export default sectionStudents;
