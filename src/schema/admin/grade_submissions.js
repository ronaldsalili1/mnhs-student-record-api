import { z } from 'zod';

export const getGradeSubmissionListSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    status: z
        .string({
            invalid_type_error: 'Status must be a string',
        })
        .optional(),
    teacher_id: z
        .string({
            required_error: 'Teacher ID is required',
            invalid_type_error: 'Teacher ID must be a string',
        })
        .length(
            24,
            { message: 'Teacher ID must be exactly 24 characters long' },
        )
        .optional(),
    start_at: z
        .string({
            invalid_type_error: 'Start At must be a string',
        })
        .optional(),
    end_at: z
        .string({
            invalid_type_error: 'End At must be a string',
        })
        .optional(),
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

export const updateGradeSubmissionStatusSchema = z.object({
    grade_submission: z.object({
        status: z
            .string({
                required_error: 'Status is required',
                invalid_type_error: 'Status must be a string',
            }),
    }),
});
