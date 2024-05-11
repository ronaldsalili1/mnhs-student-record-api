import { z } from 'zod';

// eslint-disable-next-line import/prefer-default-export
export const downloadTemplateSchema = z.object({
    subject_id: z
        .string({
            required_error: 'Subject ID is required',
            invalid_type_error: 'Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Subject ID must be exactly 24 characters long' },
        ),
    section_id: z
        .string({
            required_error: 'Section ID is required',
            invalid_type_error: 'Section ID must be a string',
        })
        .length(
            24,
            { message: 'Section ID must be exactly 24 characters long' },
        ),
    quarter: z.coerce.number({
        required_error: 'Quarter is required',
        invalid_type_error: 'Quarter must be a number',
    }),
});
