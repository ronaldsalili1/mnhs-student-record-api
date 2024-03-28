import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createTeacher,
    getTeacherById,
    getTeacherOptions,
    getTeachers,
    updateTeacherById,
} from '../../controllers/admin/teachers.js';

const teachers = new Hono().basePath('/admin/teachers');

teachers.use('*', checkAdminToken);

teachers.get('/', getTeachers);
teachers.get('/:teacherId', getTeacherById);
teachers.post('/', createTeacher);
teachers.patch('/:teacherId', updateTeacherById);

// Special endpoints
teachers.get('/all/options', getTeacherOptions);

export default teachers;
