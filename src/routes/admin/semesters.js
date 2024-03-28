import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSemester,
    getSemesterById,
    getSemesterOptions,
    getSemesters,
    updateSemesterById,
} from '../../controllers/admin/semesters.js';

const semesters = new Hono().basePath('/admin/semesters');

semesters.use('*', checkAdminToken);

semesters.get('/', getSemesters);
semesters.get('/:semesterId', getSemesterById);
semesters.post('/', createSemester);
semesters.patch('/:semesterId', updateSemesterById);

// Special endpoints
semesters.get('/all/options', getSemesterOptions);

export default semesters;
