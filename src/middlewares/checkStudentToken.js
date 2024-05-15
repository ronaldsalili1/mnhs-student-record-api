import { createFactory } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import dayjs from 'dayjs';

import { generateUnauthorizedReponse } from '../helpers/response.js';
import Student from '../models/student.js';
import statusCodes from '../constants/statusCodes.js';

const factory = createFactory();

// eslint-disable-next-line consistent-return
export default factory.createMiddleware(async (c, next) => {
    const accessToken = getCookie(c, process.env.STUDENT_ACCESS_TOKEN_KEY);
    if (!accessToken) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4011, 'Missing Access Token'));
    }

    const decodedPayload = await verify(accessToken, process.env.STUDENT_ACCESS_TOKEN_SECRET);
    if (!decodedPayload.id) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const tokenExpiresAt = dayjs(decodedPayload.expiresAt * 1000);
    if (tokenExpiresAt.isBefore(dayjs())) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const student = await Student.findOne({ _id: decodedPayload.id });
    if (!student) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4013, 'Student not found'));
    }

    c.set('student', student);

    await next();
});
