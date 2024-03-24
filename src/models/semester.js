import mongoose from 'mongoose';

import commonEnum from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        sy_start_year: { type: Date, required: true },
        sy_end_year: { type: Date, required: true },
        term: { type: Number, required: true, enum: commonEnum.semester.number },
        status: { type: String, required: true, enum: commonEnum.semester.status },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'semester',
        versionKey: false,
    },
);

export default mongoose.model('Semester', schema);
