import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createTeacher,
    getTeacherById,
    getTeachers,
    updateTeacherById,
} from '../../controllers/admin/teacher.js';

const teachers = new Hono().basePath('/admin/teachers');

teachers.use('*', checkAdminToken);

teachers.get('/', getTeachers);
teachers.get('/:teacherId', getTeacherById);
teachers.post('/', createTeacher);
teachers.patch('/:teacherId', updateTeacherById);

export default teachers;
