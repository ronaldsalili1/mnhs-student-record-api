import { createFactory } from 'hono/factory';

import statusCodes from '../constants/statusCodes.js';
import { generateUnauthorizedReponse } from '../helpers/response.js';

const factory = createFactory();

// eslint-disable-next-line consistent-return
export default factory.createMiddleware(async (c, next) => {
    const admin = c.get('admin');
    const adminId = c.req.param('adminId');

    if (!admin.roles.includes('superadmin') && adminId !== admin._id.toString()) {
        c.status(statusCodes.FORBIDDEN);
        return c.json(generateUnauthorizedReponse(4014, 'Your role cannot perform the action'));
    }

    await next();
});
