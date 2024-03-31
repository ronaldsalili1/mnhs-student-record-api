import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSubjectStudent,
    deleteSubjectStudentById,
    getSubjectStudentById,
    getSubjectStudents,
    updateSubjectStudentById,
} from '../../controllers/admin/subject_students.js';

const subjectStudents = new Hono().basePath('/admin/subject-students');

subjectStudents.use('*', checkAdminToken);

subjectStudents.get('/', getSubjectStudents);
subjectStudents.get('/:subjectStudentId', getSubjectStudentById);
subjectStudents.post('/', createSubjectStudent);
subjectStudents.patch('/:subjectStudentId', updateSubjectStudentById);
subjectStudents.delete('/:subjectStudentId', deleteSubjectStudentById);

export default subjectStudents;
