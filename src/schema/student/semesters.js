import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const getSemesterOptionsSchema = z.object({
    year: z
        .coerce
        .number({
            invalid_type_error: 'Year must be a number',
        })
        .optional(),
});
