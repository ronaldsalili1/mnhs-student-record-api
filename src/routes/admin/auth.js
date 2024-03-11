import { Hono } from 'hono';

import { login, logout, checkAuthStatus } from '../../controllers/admin/auth.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';

const auth = new Hono().basePath('/admin/auth');

auth.post('/login', login);
auth.post('/logout', logout);
auth.get('/authenticated', checkAdminToken, checkAuthStatus);

export default auth;
