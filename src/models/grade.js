import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        grade_submission_id: { type: Schema.Types.ObjectId, required: true, ref: 'GradeSubmission' },
        subject_student_id: { type: Schema.Types.ObjectId, required: true, ref: 'SubjectStudent' },
        quarter_1: { type: Number },
        quarter_2: { type: Number },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'grade',
        versionKey: false,
    },
);

export default mongoose.model('Grade', schema);