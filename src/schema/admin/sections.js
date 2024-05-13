import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const getSectionOptionsSchema = z.object({
    keyword: z
        .string({
            invalid_type_error: 'Keyword must be a string',
        })
        .optional(),
});
