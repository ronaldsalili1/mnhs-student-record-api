import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        subject_id: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
        teacher_id: { type: Schema.Types.ObjectId, required: true, ref: 'Teacher' },
        start_at: { type: Date, required: true },
        end_at: { type: Date },
        subject_name_snapshot: { type: String, required: true },
        subject_type_snapshot: { type: String, required: true },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'subject_teacher',
        versionKey: false,
    },
);

export default mongoose.model('SubjectTeacher', schema);
