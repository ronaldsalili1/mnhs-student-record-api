import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createStudent,
    getStudentById,
    getStudentOptions,
    getStudents,
    updateStudentById,
} from '../../controllers/admin/students.js';

const students = new Hono().basePath('/admin/students');

students.use('*', checkAdminToken);

students.get('/', getStudents);
students.get('/:studentId', getStudentById);
students.post('/', createStudent);
students.patch('/:studentId', updateStudentById);

// Special endpoints
students.get('/all/options', getStudentOptions);

export default students;
