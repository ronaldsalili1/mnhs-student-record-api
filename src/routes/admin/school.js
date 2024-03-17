import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { createSchool, getSchool, updateSchool } from '../../controllers/admin/school.js';

const school = new Hono().basePath('/admin/school');

school.use('*', checkAdminToken);

school.get('/', getSchool);
school.post('/', createSchool);
school.patch('/', updateSchool);

export default school;
