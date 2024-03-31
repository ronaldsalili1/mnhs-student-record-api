import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        subject_id: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
        semester_id: { type: Schema.Types.ObjectId, required: true, ref: 'Semester' },
        student_id: { type: Schema.Types.ObjectId, required: true, ref: 'Student' },
        subject_name_snapshot: { type: String, required: true },
        subject_type_snapshot: { type: String, required: true },
        sy_start_snapshot: { type: Number, required: true },
        sy_end_snapshot: { type: Number, required: true },
        semester_term_snapshot: { type: Number, required: true },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'subject_student',
        versionKey: false,
    },
);

export default mongoose.model('SubjectStudent', schema);
