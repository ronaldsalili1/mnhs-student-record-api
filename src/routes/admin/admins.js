import { Hono } from 'hono';

import {
    getAdmins,
    getAdminById,
    createAdmin,
    updateAdminById,
} from '../../controllers/admin/admins.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import checkSuperAdminRole from '../../middlewares/checkSuperAdminRole.js';
import { getAdminByIdValidator, getAdminsValidator } from '../../validators/admin/admins.js';

const admins = new Hono().basePath('/admin/admins');

admins.use('*', checkAdminToken);

admins.get('/', getAdminsValidator(), getAdmins);
admins.get('/:adminId', getAdminByIdValidator(), getAdminById);
admins.post('/', checkSuperAdminRole, createAdmin);
admins.patch('/:adminId', checkSuperAdminRole, updateAdminById);

export default admins;
