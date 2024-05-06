import { z } from 'zod';

export const getStudentListSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    semester_id: z
        .string({
            invalid_type_error: 'Semester ID must be a string',
        })
        .length(
            24,
            { message: 'Semester ID must be exactly 24 characters long' },
        )
        .optional(),
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
});

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

export const createSectionStudents = z.object({
    section_students: z.object({
        section_id: z
            .string({
                required_error: 'Section ID is required',
                invalid_type_error: 'Section ID must be a string',
            })
            .length(
                24,
                { message: 'Section ID must be exactly 24 characters long' },
            ),
        student_ids: z
            .array(
                z
                    .string({
                        invalid_type_error: 'Student ID must be a string',
                    })
                    .length(
                        24,
                        { message: 'Student ID must be exactly 24 characters long' },
                    ),
                {
                    required_error: 'Student IDs is required',
                    invalid_type_error: 'Student IDs must be an array',
                },
            )
            .nonempty({ message: 'Student IDs must not be empty' }),
    }),
});

export const deleteSectionStudentByIdSchema = z.object({
    sectionStudentId: z
        .string({
            required_error: 'Section Student ID is required',
            invalid_type_error: 'Section Student ID must be a string',
        })
        .length(
            24,
            { message: 'Section Student ID must be exactly 24 characters long' },
        ),
});
