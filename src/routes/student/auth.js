import { Hono } from 'hono';
import dayjs from 'dayjs';
import { sign } from 'hono/jwt';
import { deleteCookie, setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import Redis from 'ioredis';

// Models
import Student from '../../models/student.js';

import statusCodes from '../../constants/statusCodes.js';
import checkStudentToken from '../../middlewares/checkStudentToken.js';
import {
    generateInternalServerError,
    generateResponse, generateUnauthorizedReponse,
} from '../../helpers/response.js';
import config from '../../config/index.js';
import validate from '../../helpers/validator.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import { loginSchema, requestOtpSchema } from '../../schema/student/auth.js';
import { generateRandomString } from '../../helpers/general.js';
import { publish } from '../../helpers/rabbitmq.js';

const app = new Hono().basePath('/auth');

// GET ENDPOINTS
app.get(
    '/authenticated',
    checkStudentToken,
    checkActiveSemester,
    async (c) => {
        const student = c.get('student');
        const studentObj = student.toObject();

        const semester = c.get('semester');
        return c.json(generateResponse(statusCodes.OK, 'Success', {
            student: studentObj,
            semester,
        }));
    },
);

// POST ENDPOINTS
app.post(
    '/request-otp',
    zValidator('json', requestOtpSchema, validate),
    async (c) => {
        const { email, resend } = c.req.valid('json');

        const redis = new Redis(config.api.redis);
        if (resend) {
            const key = `auth_otp:student:${email}`;
            await redis.del(key);
        }

        const trimmedEmail = email.trim();
        const student = await Student.findOne({
            email: trimmedEmail,
        }).lean();

        if (!student) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse(statusCodes.UNAUTHORIZED, 'Email is incorrect'));
        }

        const otp = generateRandomString(6, true);
        try {
            const key = `auth_otp:student:${email}`;
            await redis.set(key, otp);
            await redis.expire(key, 900);
        } catch (error) {
            console.error(error.message);
            c.status(statusCodes.INTERNAL_SERVER_ERROR);
            return c.json(generateInternalServerError(error.message));
        }

        try {
            await publish('spawn_notification', {
                type: 'otp_request',
                to: email,
                first_name: student.first_name,
                last_name: student.last_name,
                otp,
            });
        } catch (error) {
            return c.json(generateResponse(statusCodes.BAD_REQUEST, 'Unable to send OTP notification'));
        }

        return c.json(generateResponse(200, 'Success'));
    },
);

app.post(
    '/login',
    zValidator('json', loginSchema, validate),
    async (c) => {
        const { email, otp } = c.req.valid('json');

        const trimmedEmail = email.trim();
        const student = await Student.findOne({
            email: trimmedEmail,
        });
        if (!student) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateUnauthorizedReponse());
        }

        const redis = new Redis(config.api.redis);
        const redisKey = `auth_otp:student:${email}`;
        const storedOtp = await redis.get(redisKey);
        if (!storedOtp) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'The validity of your OTP has expired.'));
        }

        if (storedOtp !== otp) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'Incorrect OTP'));
        }

        const { NODE_ENV } = process.env;
        const TOKEN_TTL = process.env.ACCESS_TOKEN_TTL;
        const expiresAt = dayjs().add(TOKEN_TTL, 'second');
        const payload = {
            id: student._id,
            created_at: dayjs().unix(),
            expires_at: expiresAt.unix(),
        };

        const key = process.env.STUDENT_ACCESS_TOKEN_KEY;
        const secret = process.env.STUDENT_ACCESS_TOKEN_SECRET;
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

        student.last_login_at = new Date();
        await student.save();
        await redis.del(redisKey);

        const newStudentObj = student.toObject();

        return c.json(generateResponse(statusCodes.OK, 'Success', { student: newStudentObj }));
    },
);

app.post(
    '/logout',
    async (c) => {
        deleteCookie(c, process.env.STUDENT_ACCESS_TOKEN_KEY);
        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

export default app;
