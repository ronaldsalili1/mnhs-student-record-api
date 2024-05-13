import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const getStudentOptionsSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    section_id: z
        .string({
            invalid_type_error: 'Section ID must be a string',
        })
        .length(
            24,
            { message: 'Section ID must be exactly 24 characters long' },
        )
        .optional(),
    keyword: z
        .string({
            invalid_type_error: 'Keyword must be a string',
        })
        .optional(),
    exclude: z
        .string({
            invalid_type_error: 'Exclude must be a string',
        })
        .optional(),
    exclude_students_in_section: z
        .string({
            required_error: 'exclude_students_in_section is required',
            invalid_type_error: 'exclude_students_in_section must be a string',
        })
        .refine((value) => value === 'true' || value === 'false', {
            message: 'exclude_students_in_section must be a boolean string',
        })
        .transform((value) => value === 'true'),
});
