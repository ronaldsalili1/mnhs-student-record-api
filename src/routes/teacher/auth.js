import { Hono } from 'hono';
import bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { sign } from 'hono/jwt';
import { deleteCookie, setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import Redis from 'ioredis';

// Models
import Teacher from '../../models/teacher.js';
import Sections from '../../models/section.js';
import SectionAdviser from '../../models/section_adviser.js';

import statusCodes from '../../constants/statusCodes.js';
import checkTeacherToken from '../../middlewares/checkTeacherToken.js';
import {
    generateInternalServerError,
    generateRecordNotExistsReponse,
    generateResponse, generateUnauthorizedReponse,
} from '../../helpers/response.js';
import config from '../../config/index.js';
import validate from '../../helpers/validator.js';
import checkActiveSemester from '../../middlewares/checkActiveSemester.js';
import { loginSchema, passwordResetRequestSchema, resetPasswordSchema } from '../../schema/teacher/auth.js';
import { generateRandomString } from '../../helpers/general.js';
import { publish } from '../../helpers/rabbitmq.js';

const app = new Hono().basePath('/auth');

// GET ENDPOINTS
app.get(
    '/authenticated',
    checkTeacherToken,
    checkActiveSemester,
    async (c) => {
        const teacher = c.get('teacher');
        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        const now = dayjs();
        const sectionAdviserQuery = {
            $and: [
                { teacher_id: teacher._id },
                { start_at: { $lte: now } },
                {
                    $or: [
                        { end_at: null },
                        { end_at: { $exists: false } },
                        { end_at: { $gt: now } },
                    ],
                },
            ],
        };

        // Get the current section of the teacher
        const sectionAdvisers = await SectionAdviser.find(sectionAdviserQuery).lean();
        // eslint-disable-next-line max-len
        const sections = await Sections.find({ _id: { $in: sectionAdvisers.map((sectionAdviser) => sectionAdviser.section_id) } })
            .sort({ name: 1 })
            .lean();

        const semester = c.get('semester');
        return c.json(generateResponse(statusCodes.OK, 'Success', {
            teacher: {
                ...teacherObj,
                sections,
            },
            semester,
        }));
    },
);

// POST ENDPOINTS
app.post(
    '/login',
    zValidator('json', loginSchema, validate),
    async (c) => {
        const { email, password } = c.req.valid('json');
        const trimmedEmail = email.trim();

        const teacher = await Teacher.findOne({
            email: trimmedEmail,
            status: 'enabled',
        });

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

        teacher.last_login_at = new Date();
        await teacher.save();

        const teacherObj = teacher.toObject();
        delete teacherObj.password;

        return c.json(generateResponse(statusCodes.OK, 'Success', { teacher: teacherObj }));
    },
);

app.post(
    '/logout',
    async (c) => {
        deleteCookie(c, process.env.TEACHER_ACCESS_TOKEN_KEY);
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
            const key = `reset_password_token:teacher:${old_token}`;
            await redis.del(key);
        }

        const token = generateRandomString();
        // Find teacher
        const teacher = await Teacher.findOne({ email, status: 'enabled' }).lean();
        if (!teacher) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse(`Teacher with email ${email}`));
        }
        delete teacher.password;

        try {
            const key = `reset_password_token:teacher:${token}`;
            await redis.set(key, JSON.stringify(teacher));
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
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                link: `${config.teacher.host}${config.teacher.prefix}/password-reset/${token}`,
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
        const key = `reset_password_token:teacher:${token}`;
        const teacherString = await redis.get(key);
        if (!teacherString) {
            c.status(statusCodes.FORBIDDEN);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'The validity of your password reset request has expired. Kindly submit a new request. Thank you!'));
        }

        const teacherObj = JSON.parse(teacherString);
        const teacher = await Teacher.findById(teacherObj._id);
        if (!teacher) {
            c.status(statusCodes.NOT_FOUND);
            return c.json(generateRecordNotExistsReponse('Teacher'));
        }

        // Check if new_password and confirm_new_password matched
        if (new_password !== confirm_new_password) {
            c.status(statusCodes.UNAUTHORIZED);
            return c.json(generateResponse(statusCodes.FORBIDDEN, 'New password did not match'));
        }

        const saltRounds = 10;
        const password = await bcrypt.hash(new_password, saltRounds);

        teacher.password = password;
        await teacher.save();

        await redis.del(key);

        return c.json(generateResponse(statusCodes.OK, 'Success'));
    },
);

export default app;
