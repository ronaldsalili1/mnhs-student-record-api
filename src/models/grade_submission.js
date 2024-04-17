import mongoose from 'mongoose';

import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        admin_id: { type: Schema.Types.ObjectId, required: true, ref: 'Admin' },
        semester_id: { type: Schema.Types.ObjectId, required: true, ref: 'Semester' },
        subject_id: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
        teacher_id: { type: Schema.Types.ObjectId, required: true, ref: 'Teacher' },
        status: { type: String, enum: commonEnums.grade.status, required: true },
        submitted_at: { type: Date, required: true },
        marked_under_review_at: { type: Date },
        marked_approved_at: { type: Date },
        remark: { type: String },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'grade_submission',
        versionKey: false,
    },
);

export default mongoose.model('GradeSubmission', schema);
