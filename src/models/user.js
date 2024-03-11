import mongoose from 'mongoose';
import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        status: { type: String, enum: commonEnums.user.status, required: true },
        createdBy: { type: Schema.Types.ObjectId },
        updatedBy: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        collection: 'user',
        versionKey: false,
    },
);

export default mongoose.model('User', schema);
