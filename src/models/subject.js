import mongoose from 'mongoose';

import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        name: { type: String, required: true },
        type: { type: Number, enum: commonEnums.subject.type, required: true },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'subject',
        versionKey: false,
    },
);

export default mongoose.model('Subject', schema);
