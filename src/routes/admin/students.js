import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createStudent,
    getStudentById,
    getStudents,
    updateStudentById,
} from '../../controllers/admin/students.js';

const students = new Hono().basePath('/admin/students');

students.use('*', checkAdminToken);

students.get('/', getStudents);
students.get('/:studentId', getStudentById);
students.post('/', createStudent);
students.patch('/:studentId', updateStudentById);

export default students;
