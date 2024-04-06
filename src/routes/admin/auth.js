import { Hono } from 'hono';

import { login, logout, checkAuthStatus } from '../../controllers/admin/auth.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { loginValidator } from '../../validators/admin/auth.js';

const auth = new Hono().basePath('/admin/auth');

auth.post('/login', loginValidator(), login);
auth.post('/logout', logout);
auth.get('/authenticated', checkAdminToken, checkAuthStatus);

export default auth;
