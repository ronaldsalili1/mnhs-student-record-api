import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const getTeacherOptionsSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    keyword: z
        .string({
            invalid_type_error: 'Keyword must be a string',
        })
        .optional(),
});
