import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import dayjs from 'dayjs';

import { generateUnauthorizedReponse } from '../helpers/response.js';
import Admin from '../models/admin.js';

// eslint-disable-next-line consistent-return
export default async (c, next) => {
    const accessToken = getCookie(c, process.env.ACCESS_TOKEN_KEY);
    if (!accessToken) {
        c.status(401);
        return c.json(generateUnauthorizedReponse(4011, 'Missing Access Token'));
    }

    const decodedPayload = await verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedPayload.id) {
        c.status(401);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const tokenExpiresAt = dayjs(decodedPayload.expiresAt * 1000);
    if (tokenExpiresAt.isBefore(dayjs())) {
        c.status(401);
        return c.json(generateUnauthorizedReponse(4012, 'Expired Token'));
    }

    const admin = await Admin.findOne({ _id: decodedPayload.id, status: 'enabled' }).lean();
    if (!admin) {
        c.status(401);
        return c.json(generateUnauthorizedReponse(4013, 'Admin not found'));
    }

    c.set('admin', admin);

    await next();
};
