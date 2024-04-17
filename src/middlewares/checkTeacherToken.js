import { createFactory } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import dayjs from 'dayjs';

import { generateUnauthorizedReponse } from '../helpers/response.js';
import Teacher from '../models/teacher.js';
import statusCodes from '../constants/statusCodes.js';

const factory = createFactory();

// eslint-disable-next-line consistent-return
export default factory.createMiddleware(async (c, next) => {
    const accessToken = getCookie(c, process.env.TEACHER_ACCESS_TOKEN_KEY);
    if (!accessToken) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4011, 'Missing Access Token'));
    }

    const decodedPayload = await verify(accessToken, process.env.TEACHER_ACCESS_TOKEN_SECRET);
    if (!decodedPayload.id) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const tokenExpiresAt = dayjs(decodedPayload.expiresAt * 1000);
    if (tokenExpiresAt.isBefore(dayjs())) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const teacher = await Teacher.findOne({ _id: decodedPayload.id, status: 'enabled' }).lean();
    if (!teacher) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4013, 'Teacher not found'));
    }

    c.set('teacher', teacher);

    await next();
});
