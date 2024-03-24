import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSubject,
    getSubjectById,
    getSubjects,
    updateSubjectById,
} from '../../controllers/admin/subjects.js';

const subjects = new Hono().basePath('/admin/subjects');

subjects.use('*', checkAdminToken);

subjects.get('/', getSubjects);
subjects.get('/:subjectId', getSubjectById);
subjects.post('/', createSubject);
subjects.patch('/:subjectId', updateSubjectById);

export default subjects;
