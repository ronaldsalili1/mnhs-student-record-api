import { zValidator } from '@hono/zod-validator';

import statusCodes from '../constants/statusCodes.js';
import { generateValidationErrorResponse } from './response.js';

const validator = (requestContent, schema) => (
    // eslint-disable-next-line consistent-return
    zValidator(requestContent, schema, (result, c) => {
        if (!result.success) {
            c.status(statusCodes.BAD_REQUEST);
            return c.json(generateValidationErrorResponse(result.error?.errors[0]?.message || 'Schema validation error'));
        }
    })
);

export default validator;
