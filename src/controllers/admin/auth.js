import bcrypt from 'bcrypt';
import { sign } from 'hono/jwt';
import { setCookie, deleteCookie } from 'hono/cookie';
import dayjs from 'dayjs';

import Admin from '../../models/admin.js';
import { generateResponse, generateUnauthorizedReponse } from '../../helpers/response.js';
import statusCodes from '../../constants/enums/statusCodes.js';

export const login = async (c) => {
    const { email, password } = await c.req.json();
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
            domain: process.env.DOMAIN,
            sameSite: 'Strict',
        }),

    });

    delete admin.password;

    return c.json(generateResponse(200, 'Success', { admin }));
};

export const logout = async (c) => {
    deleteCookie(c, process.env.ACCESS_TOKEN_KEY);

    return c.json(generateResponse(200, 'Success'));
};

export const checkAuthStatus = async (c) => {
    const admin = c.get('admin');

    delete admin.password;

    return c.json(generateResponse(200, 'Success', { admin }));
};
