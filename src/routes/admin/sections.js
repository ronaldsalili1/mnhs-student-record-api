import { Hono } from 'hono';

import checkAdminToken from '../../middlewares/checkAdminToken.js';

const sections = new Hono().basePath('/admin/sections');

sections.use('*', checkAdminToken);

sections.get('/', () => {});
sections.get('/:sectionId', () => {});
sections.post('/', () => {});
sections.patch('/:sectionId', () => {});

export default sections;
