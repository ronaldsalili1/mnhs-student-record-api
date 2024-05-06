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

export const getSubjectOptionsSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    type: z
        .string({
            invalid_type_error: 'Type must be a string',
        })
        .optional(),
    exclude: z
        .string({
            invalid_type_error: 'Exclude must be a string',
        })
        .optional(),
    keyword: z
        .string({
            invalid_type_error: 'Keyword must be a string',
        })
        .optional(),
});

export const createSectionSubjects = z.object({
    section_subjects: z.object({
        section_id: z
            .string({
                required_error: 'Section ID is required',
                invalid_type_error: 'Section ID must be a string',
            })
            .length(
                24,
                { message: 'Section ID must be exactly 24 characters long' },
            ),
        subject_ids: z
            .array(
                z
                    .string({
                        invalid_type_error: 'Subject ID must be a string',
                    })
                    .length(
                        24,
                        { message: 'Subject ID must be exactly 24 characters long' },
                    ),
                {
                    required_error: 'Subject IDs is required',
                    invalid_type_error: 'Subject IDs must be an array',
                },
            )
            .nonempty({ message: 'Student IDs must not be empty' }),
    }),
});

export const deleteSectionSubjectByIdSchema = z.object({
    sectionSubjectId: z
        .string({
            required_error: 'Section Subject ID is required',
            invalid_type_error: 'Section Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Section Subject ID must be exactly 24 characters long' },
        ),
});
