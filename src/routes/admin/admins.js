import { Hono } from 'hono';

import {
    getAdmins,
    getAdminById,
    createAdmin,
    updateAdminById,
} from '../../controllers/admin/admin.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import checkSuperAdminRole from '../../middlewares/checkSuperAdminRole.js';

const admins = new Hono().basePath('/admin/admins');

admins.use('*', checkAdminToken);

admins.get('/', getAdmins);
admins.get('/:adminId', getAdminById);
admins.post('/', checkSuperAdminRole, createAdmin);
admins.patch('/:adminId', checkSuperAdminRole, updateAdminById);

export default admins;
