import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        grade_submission_id: { type: Schema.Types.ObjectId, required: true, ref: 'GradeSubmission' },
        subject_id: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
        semester_id: { type: Schema.Types.ObjectId, required: true, ref: 'Semester' },
        student_id: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
        quarter: { type: Number, required: true },
        grade: { type: Number, required: true },
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
