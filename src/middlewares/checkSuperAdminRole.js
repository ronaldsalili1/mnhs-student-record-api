import statusCodes from '../constants/enums/statusCodes.js';
import { generateUnauthorizedReponse } from '../helpers/response.js';

// eslint-disable-next-line consistent-return
export default async (c, next) => {
    const admin = c.get('admin');
    const adminId = c.req.param('adminId');

    if (!admin.roles.includes('superadmin') && adminId !== admin._id.toString()) {
        c.status(statusCodes.FORBIDDEN);
        return c.json(generateUnauthorizedReponse(4014, 'Your role cannot perform the action'));
    }

    await next();
};
