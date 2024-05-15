import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const getGradeListSchema = z.object({
    semester_id: z
        .string({
            required_error: 'Semester ID is required',
            invalid_type_error: 'Semester ID must be a string',
        })
        .length(
            24,
            { message: 'Semester ID must be exactly 24 characters long' },
        )
        .optional(),
});
