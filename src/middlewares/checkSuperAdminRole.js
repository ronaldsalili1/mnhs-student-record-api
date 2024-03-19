import statusCodes from '../constants/enums/statusCodes.js';
import { generateUnauthorizedReponse } from '../helpers/response.js';

// eslint-disable-next-line consistent-return
export default async (c, next) => {
    const admin = c.get('admin');
    if (!admin.roles.includes('superadmin')) {
        c.status(statusCodes.FORBIDDEN);
        return c.json(generateUnauthorizedReponse(4014, 'Your role cannot perform the action'));
    }

    await next();
};
