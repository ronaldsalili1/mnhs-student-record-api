import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        section_id: { type: Schema.Types.ObjectId, required: true, ref: 'Semester' },
        semester_id: { type: Schema.Types.ObjectId, required: true, ref: 'Semester' },
        subject_id: { type: Schema.Types.ObjectId, required: true, ref: 'Subject' },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'section_subject',
        versionKey: false,
    },
);

export default mongoose.model('SectionSubject', schema);
