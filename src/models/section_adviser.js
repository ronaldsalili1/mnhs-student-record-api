import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        section_id: { type: Schema.Types.ObjectId, required: true, ref: 'Section' },
        teacher_id: { type: Schema.Types.ObjectId, required: true, ref: 'Teacher' },
        start_at: { type: Date, required: true },
        end_at: { type: Date },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'section_adviser',
        versionKey: false,
    },
);

export default mongoose.model('SectionAdviser', schema);
