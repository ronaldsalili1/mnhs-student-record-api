import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { sign } from 'hono/jwt';
import { deleteCookie, setCookie } from 'hono/cookie';
import Redis from 'ioredis';

import { zValidator } from '@hono/zod-validator';
import statusCodes from '../../constants/statusCodes.js';
import checkAdminToken from '../../middlewares/checkAdminToken.js';
import Admin from '../../models/admin.js';
import {
    generateInternalServerError,
    generateRecordNotExistsReponse,
    generateResponse,
    generateUnauthorizedReponse,
} from '../../helpers/response.js';
import config from '../../config/index.js';
import { authJsonSchema, passwordResetRequestSchema, resetPasswordSchema } from '../../schema/admin/auth.js';
import validate from '../../helpers/validator.js';
import { generateRandomString } from '../../helpers/general.js';
import { publish } from '../../helpers/rabbitmq.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';

const app = new Hono().basePath('/auth');

// GET ENDPOINTS
app.get(
    '/authenticated',
    checkAdminToken,
    checkActiveSemester,
    async (c) => {
        const admin = c.get('admin');
        delete admin.password;

        const semester = c.get('semester');
        return c.json(generateResponse(statusCodes.OK, 'Success', { admin, semester }));
    },
);

// POST ENDPOINTS
app.post(
    '/login',
    zValidator('json', authJsonSchema, validate),
    async (c) => {
        const { email, password } = c.req.valid('json');
        const trimmedEmail = email.trim();

        const admin = await Admin.findOne({
            email: trimmedEmail,
            status: 'enabled',
        });

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

        const key = process.env.ADMIN_ACCESS_TOKEN_KEY;
        const secret = process.env.ADMIN_ACCESS_TOKEN_SECRET;
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

        admin.last_login_at = new Date();
        await admin.save();

        const adminObj = admin.toObject();
        delete adminObj.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { admin: adminObj }));
    },
);

app.post(
    '/logout',
    async (c) => {
        deleteCookie(c, process.env.ADMIN_ACCESS_TOKEN_KEY);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

app.post(
    '/reset-password/request',
    zValidator('json', passwordResetRequestSchema, validate),
    async (c) => {
        const { email, resend, old_token } = c.req.valid('json');
        const redis = new Redis(config.api.redis);

        if (resend) {
            const key = `reset_password_token:admin:${old_token}`;
            await redis.del(key);
        }

        const token = generateRandomString();
        // Find admin
        const admin = await Admin.findOne({ email, status: 'enabled' }).lean();
        if (!admin) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse(`Admin with email ${email}`));
        }
        delete admin.password;

        try {
            const key = `reset_password_token:admin:${token}`;
            await redis.set(key, JSON.stringify(admin));
            await redis.expire(key, 900);
        } catch (error) {
            console.error(error.message);
            c.status(statusCodes.INTERNAL_SERVER_ERROR);
            return c.json(generateInternalServerError(error.message));
        }

        try {
            await publish('spawn_notification', {
                type: 'password_reset_request',
                to: email,
                first_name: admin.first_name,
                last_name: admin.last_name,
                link: `${config.admin.host}${config.admin.prefix}/password-reset/${token}`,
            });
        } catch (error) {
            return c.json(generateResponse(statusCodes.BAD_REQUEST, 'Unable to send password reset request notification'));
        }

        return c.json(generateResponse(200, 'Success'));
    },
);

app.post(
    '/reset-password',
    zValidator('json', resetPasswordSchema, validate),
    async (c) => {
        const {
            token,
            new_password,
            confirm_new_password,
        } = c.req.valid('json');
        const redis = new Redis(config.api.redis);

        // Check if the token is valid
        const key = `reset_password_token:admin:${token}`;
        const adminString = await redis.get(key);
        if (!adminString) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'The validity of your password reset request has expired. Kindly submit a new request. Thank you!'));
        }

        const adminObj = JSON.parse(adminString);
        const admin = await Admin.findById(adminObj._id);
        if (!admin) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('admin'));
        }

        // Check if new_password and confirm_new_password matched
        if (new_password !== confirm_new_password) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'New password did not match'));
        }

        const saltRounds = 10;
        const password = await bcrypt.hash(new_password, saltRounds);

        admin.password = password;
        await admin.save();

        await redis.del(key);

        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

export default app;
