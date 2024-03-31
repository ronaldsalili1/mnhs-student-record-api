import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSubjectTeacher,
    getSubjectTeacherById,
    getSubjectTeachers,
    updateSubjectTeacherById,
} from '../../controllers/admin/subject_teachers.js';

const subjectTeachers = new Hono().basePath('/admin/subject-teachers');

subjectTeachers.use('*', checkAdminToken);

subjectTeachers.get('/', getSubjectTeachers);
subjectTeachers.get('/:subjectTeacherId', getSubjectTeacherById);
subjectTeachers.post('/', createSubjectTeacher);
subjectTeachers.patch('/:subjectTeacherId', updateSubjectTeacherById);

export default subjectTeachers;
