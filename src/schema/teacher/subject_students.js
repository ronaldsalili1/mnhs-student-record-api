import { z } from 'zod';

// GET
export const getSubjectStudentListSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    subject_id: z
        .string({
            required_error: 'Subject ID is required',
            invalid_type_error: 'Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Subject ID must be exactly 24 characters long' },
        ),
    semester_id: z
        .string({
            invalid_type_error: 'Semester ID must be a string',
        })
        .length(
            24,
            { message: 'Semester ID must be exactly 24 characters long' },
        )
        .optional(),
    keyword: z
        .string({
            invalid_type_error: 'Keyword must be a string',
        })
        .optional(),
});

export const getSubjectStudentOptionsSchema = z.object({
    subject_id: z
        .string({
            required_error: 'Subject ID is required',
            invalid_type_error: 'Subject ID must be a string',
        })
        .length(
            24,
            { message: 'Subject ID must be exactly 24 characters long' },
        ),
    semester_id: z
        .string({
            required_error: 'Semester ID is required',
            invalid_type_error: 'Semester ID must be a string',
        })
        .length(
            24,
            { message: 'Semester ID must be exactly 24 characters long' },
        ),
});

export const getSubjectStudentByIdSchema = z.object({
    studentId: z
        .string({
            required_error: 'Student ID is required',
            invalid_type_error: 'Student ID must be a string',
        })
        .length(
            24,
            { message: 'Student ID must be exactly 24 characters long' },
        ),
});

// POST
export const createSubjectStudentSchema = z.object({
    student: z.object({
        subject_id: z
            .string({
                required_error: 'Subject ID is required',
                invalid_type_error: 'Subject ID must be a string',
            })
            .length(
                24,
                { message: 'Subject ID must be exactly 24 characters long' },
            ),
        semester_id: z
            .string({
                required_error: 'Semester ID is required',
                invalid_type_error: 'Semester ID must be a string',
            })
            .length(
                24,
                { message: 'Semester ID must be exactly 24 characters long' },
            ),
        student_ids: z
            .array(
                z
                    .string({
                        invalid_type_error: 'Student ID must be a string',
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

// DELETE
export const deleteSubjectStudentByIdSchema = z.object({
    subjectStudentId: z
        .string({
            required_error: 'Subject\'s student ID is required',
            invalid_type_error: 'Subject\'s student ID must be a string',
        })
        .length(
            24,
            { message: 'Subject\'s student ID must be exactly 24 characters long' },
        ),
});
