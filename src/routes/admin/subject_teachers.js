import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSubjectTeacher,
    getSubjectTeacherById,
    getSubjectTeachers,
    updateSubjectTeacherById,
} from '../../controllers/admin/subject_teachers.js';

const subjectTeacher = new Hono().basePath('/admin/subject-teachers');

subjectTeacher.use('*', checkAdminToken);

subjectTeacher.get('/', getSubjectTeachers);
subjectTeacher.get('/:subjectTeacherId', getSubjectTeacherById);
subjectTeacher.post('/', createSubjectTeacher);
subjectTeacher.patch('/:subjectTeacherId', updateSubjectTeacherById);

export default subjectTeacher;
