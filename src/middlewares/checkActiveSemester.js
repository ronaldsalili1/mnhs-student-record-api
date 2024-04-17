import { createFactory } from 'hono/factory';

import Semester from '../models/semester.js';
import statusCodes from '../constants/statusCodes.js';
import { generateResponse } from '../helpers/response.js';

const factory = createFactory();

// eslint-disable-next-line consistent-return
export default factory.createMiddleware(async (c, next) => {
    const semester = await Semester.findOne({ status: 'active' }).lean();
    if (!semester) {
        c.status(statusCodes.NOT_FOUND);
        return c.json(generateResponse(
            statusCodes.NOT_FOUND,
            'There is no active semester at the moment',
        ));
    }

    c.set('semester', semester);

    await next();
});
