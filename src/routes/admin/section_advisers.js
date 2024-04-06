import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSectionAdviser,
    getSectionAdviserById,
    getSectionAdvisers,
    updateSectionAdviserById,
} from '../../controllers/admin/section_advisers.js';

const sectionAdvisers = new Hono().basePath('/admin/section-advisers');

sectionAdvisers.use('*', checkAdminToken);

sectionAdvisers.get('/', getSectionAdvisers);
sectionAdvisers.get('/:sectionAdviserId', getSectionAdviserById);
sectionAdvisers.post('/', createSectionAdviser);
sectionAdvisers.patch('/:sectionAdviserId', updateSectionAdviserById);

export default sectionAdvisers;
