import { z } from 'zod';

export const getSubjectListSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
});

export const getSubjectByIdSchema = z.object({
    subjectId: z
        .string({
            required_error: 'Subject ID is required',
            invalid_type_error: 'Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Subject ID must be exactly 24 characters long' },
        ),
});
