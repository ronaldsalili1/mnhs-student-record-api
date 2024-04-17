import { z } from 'zod';

export const getGradeSubmissionListSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
});

export const gradeSubmissionSchema = z.object({
    grade_submission: z.object({
        admin_id: z
            .string({
                required_error: 'Admin ID is required',
                invalid_type_error: 'Admin ID must be a string',
            })
            .length(
                24,
                { message: 'Admin ID must be exactly 24 characters long' },
            ),
        subject_id: z
            .string({
                required_error: 'Subject ID is required',
                invalid_type_error: 'Subject ID must be a string',
            })
            .length(
                24,
                { message: 'Subject ID must be exactly 24 characters long' },
            ),
        remark: z.string({ invalid_type_error: 'Remark must be a string' }).optional(),
        grades: z.array(
            z.object({
                student_id: z
                    .string({
                        required_error: 'Student ID is required',
                        invalid_type_error: 'Student ID must be a string',
                    })
                    .length(
                        24,
                        { message: 'Student ID must be exactly 24 characters long' },
                    ),
                quarter_1: z.number({ invalid_type_error: 'Quarter 1 must be a number' }).optional(),
                quarter_2: z.number({ invalid_type_error: 'Quarter 1 must be a number' }).optional(),
            }),
        )
            .nonempty({ message: 'Grades must not be empty' }),
    }),
});

export const getGradeSubmissionByIdSchema = z.object({
    gradeSubmissionId: z
        .string({
            required_error: 'Grade Submission ID is required',
            invalid_type_error: 'Grade Submission ID must be a string',
        })
        .length(
            24,
            { message: 'Grade Submission ID must be exactly 24 characters long' },
        ),
});
