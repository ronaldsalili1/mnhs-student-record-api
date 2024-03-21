import mongoose from 'mongoose';
import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        status: { type: String, enum: commonEnums.teacher.status, required: true },
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        middle_name: { type: String },
        suffix: { type: String },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'teacher',
        versionKey: false,
    },
);

export default mongoose.model('Teacher', schema);
