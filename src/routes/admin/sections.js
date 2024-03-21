import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';
import {
    createSection,
    getSectionById,
    getSections,
    updateSectionById,
} from '../../controllers/admin/sections.js';

const sections = new Hono().basePath('/admin/sections');

sections.use('*', checkAdminToken);

sections.get('/', getSections);
sections.get('/:sectionId', getSectionById);
sections.post('/', createSection);
sections.patch('/:sectionId', updateSectionById);

export default sections;
