import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { sign } from 'hono/jwt';
import { deleteCookie, setCookie } from 'hono/cookie';

import statusCodes from '../../constants/statusCodes.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import { authJsonValidator } from '../../validators/admin/auth.js';
import Admin from '../../models/admin.js';
import { generateResponse, generateUnauthorizedReponse } from '../../helpers/response.js';
import config from '../../config/index.js';

const app = new Hono().basePath('/auth');

// GET ENDPOINTS
app.get(
    '/authenticated',
    checkAdminToken,
    async (c) => {
        const admin = c.get('admin');
        delete admin.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { admin }));
    },
);

// POST ENDPOINTS
app.post(
    '/login',
    authJsonValidator(),
    async (c) => {
        const { email, password } = await c.req.valid('json');
        const trimmedEmail = email.trim();

        const admin = await Admin.findOne({
            email: trimmedEmail,
            status: 'enabled',
        }).lean();

        if (!admin) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse());
        }

        const passwordMatched = await bcrypt.compare(password, admin.password);
        if (!passwordMatched) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse());
        }

        const { NODE_ENV } = process.env;
        const TOKEN_TTL = process.env.ACCESS_TOKEN_TTL;
        const expiresAt = dayjs().add(TOKEN_TTL, 'second');
        const payload = {
            id: admin._id,
            created_at: dayjs().unix(),
            expires_at: expiresAt.unix(),
        };

        const key = process.env.ACCESS_TOKEN_KEY;
        const secret = process.env.ACCESS_TOKEN_SECRET;
        const accessToken = await sign(payload, secret);

        setCookie(c, key, accessToken, {
            path: '/',
            httpOnly: true,
            expires: expiresAt.toDate(),
            maxAge: TOKEN_TTL,
            ...(NODE_ENV !== 'development' && {
                secure: true,
                domain: config.api.domain,
                sameSite: 'Strict',
            }),

        });

        delete admin.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { admin }));
    },
);

app.post(
    '/logout',
    async (c) => {
        deleteCookie(c, process.env.ACCESS_TOKEN_KEY);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

export default app;
