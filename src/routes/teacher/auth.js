import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { sign } from 'hono/jwt';
import { deleteCookie, setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';

import statusCodes from '../../constants/statusCodes.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import { authJsonSchema } from '../../schema/teacher/auth.js';
import Teacher from '../../models/teacher.js';
import { generateResponse, generateUnauthorizedReponse } from '../../helpers/response.js';
import config from '../../config/index.js';
import validate from '../../helpers/validator.js';

const app = new Hono().basePath('/auth');

// GET ENDPOINTS
app.get(
    '/authenticated',
    checkTeacherToken,
    async (c) => {
        const teacher = c.get('teacher');
        delete teacher.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher }));
    },
);

// POST ENDPOINTS
app.post(
    '/login',
    zValidator('json', authJsonSchema, validate),
    async (c) => {
        const { email, password } = c.req.valid('json');
        const trimmedEmail = email.trim();

        const teacher = await Teacher.findOne({
            email: trimmedEmail,
            status: 'enabled',
        }).lean();

        if (!teacher) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse());
        }

        const passwordMatched = await bcrypt.compare(password, teacher.password);
        if (!passwordMatched) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse());
        }

        const { NODE_ENV } = process.env;
        const TOKEN_TTL = process.env.ACCESS_TOKEN_TTL;
        const expiresAt = dayjs().add(TOKEN_TTL, 'second');
        const payload = {
            id: teacher._id,
            created_at: dayjs().unix(),
            expires_at: expiresAt.unix(),
        };

        const key = process.env.TEACHER_ACCESS_TOKEN_KEY;
        const secret = process.env.TEACHER_ACCESS_TOKEN_SECRET;
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

        delete teacher.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher }));
    },
);

app.post(
    '/logout',
    async (c) => {
        deleteCookie(c, process.env.TEACHER_ACCESS_TOKEN_KEY);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

export default app;
