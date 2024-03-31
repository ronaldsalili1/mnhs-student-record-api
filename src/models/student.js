import mongoose from 'mongoose';

import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        email: { type: String },
        guardian_email: { type: String },
        last_name: { type: String, required: true },
        first_name: { type: String, required: true },
        middle_name: { type: String },
        suffix: { type: String },
        lrn: { type: String, required: true, unique: true },
        birthdate: { type: Date, required: true },
        sex: { type: String, required: true, enum: commonEnums.sex },
        shs_admission_date: { type: Date },
        track: { type: String, required: true, enum: commonEnums.student.track },
        strand: { type: String, required: true, enum: commonEnums.student.strand },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'student',
        versionKey: false,
    },
);

export default mongoose.model('Student', schema);
