import statusCodes from '../constants/enums/statusCodes.js';
import { generateUnauthorizedReponse } from '../helpers/response.js';

// eslint-disable-next-line consistent-return
export default async (c, next) => {
    const apiKey = c.req.header('worker-api-key');

    if (!apiKey) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4011, 'Missing worker-api-key'));
    }

    if (apiKey !== process.env.WORKER_API_KEY) {
        c.status(statusCodes.UNAUTHORIZED);
        return c.json(generateUnauthorizedReponse(4011, 'Unauthorized api key'));
    }

    await next();
};
