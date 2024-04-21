import { createFactory } from 'hono/factory';

import Semester from '../models/semester.js';

const factory = createFactory();

// eslint-disable-next-line consistent-return
export default factory.createMiddleware(async (c, next) => {
    const semester = await Semester.findOne({ status: 'active' }).lean();

    c.set('semester', semester);

    await next();
});
