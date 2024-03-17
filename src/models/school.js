import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        name: { type: String, required: true },
        school_id: { type: String, required: true },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'school',
        versionKey: false,
    },
);

export default mongoose.model('School', schema);
