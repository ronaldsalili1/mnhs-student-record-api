import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSubject,
    getSubjectById,
    getSubjectOptions,
    getSubjects,
    updateSubjectById,
} from '../../controllers/admin/subjects.js';

const subjects = new Hono().basePath('/admin/subjects');

subjects.use('*', checkAdminToken);

subjects.get('/', getSubjects);
subjects.get('/:subjectId', getSubjectById);
subjects.post('/', createSubject);
subjects.patch('/:subjectId', updateSubjectById);

// Special endpoints
subjects.get('/all/options', getSubjectOptions);

export default subjects;
