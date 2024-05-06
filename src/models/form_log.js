import mongoose from 'mongoose';

import common from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        admin_id: { type: Schema.Types.ObjectId, ref: 'Admin' },
        teacher_id: { type: Schema.Types.ObjectId, ref: 'Teacher' },
        form: { type: String, required: true, enum: common.form },
        generated_at: { type: Date, required: true },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'form_log',
        versionKey: false,
    },
);

export default mongoose.model('FormLog', schema);
