import statusCodes from '../constants/statusCodes.js';
import { generateValidationErrorResponse } from './response.js';

// eslint-disable-next-line consistent-return
const validate = (result, c) => {
    console.log('🚀 ~ result:', result);
    if (!result.success) {
        c.status(statusCodes.BAD_REQUEST);
        return c.json(generateValidationErrorResponse(result.error?.errors[0]?.message || 'Schema validation error'));
    }
};

export default validate;
