import { z } from 'zod';
import validator from '../../helpers/validator.js';

// eslint-disable-next-line import/prefer-default-export
export const authJsonValidator = () => {
    const schema = z.object({
        email: z.string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        }),
        password: z.string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be a string',
        }),
    });

    return validator('json', schema);
};
