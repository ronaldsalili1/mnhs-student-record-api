import mongoose from 'mongoose';
import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        status: { type: String, enum: commonEnums.admin.status, required: true },
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        middle_name: { type: String },
        suffix: { type: String },
        roles: { type: [String], enum: commonEnums.admin.roles, required: true },
        last_login_at: { type: Date },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'admin',
        versionKey: false,
    },
);

export default mongoose.model('Admin', schema);
