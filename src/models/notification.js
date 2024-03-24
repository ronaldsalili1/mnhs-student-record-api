import mongoose from 'mongoose';
import commonEnums from '../constants/enums/common.js';

const { Schema } = mongoose;

const schema = new Schema(
    {
        channel: { type: String, enum: commonEnums.notification.channel, required: true },
        type: { type: String, enum: commonEnums.notification.type, required: true },
        status: { type: String, enum: commonEnums.notification.status, required: true },
        to: { type: String, required: true },
        from: { type: String, required: true },
        cc: { type: String },
        bcc: { type: String },
        subject: { type: String },
        content: { type: String, required: true },
        sent_at: { type: Date },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'notification',
        versionKey: false,
    },
);

export default mongoose.model('Notification', schema);
