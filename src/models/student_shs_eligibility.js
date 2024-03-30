import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema(
    {
        hs_completer: { type: Boolean },
        hs_gen_avg: { type: Number },
        jhs_completer: { type: Boolean },
        jhs_gen_avg: { type: Number },
        completion_date: { type: Date },
        school_name: { type: String },
        school_address: { type: String },
        pept_passer: { type: Boolean },
        pept_rating: { type: String },
        als_ae_passer: { type: Boolean },
        als_ae_rating: { type: String },
        others: { type: String },
        assesment_date: { type: Date },
        clc_name_address: { type: String },
        created_by: { type: Schema.Types.ObjectId },
        updated_by: { type: Schema.Types.ObjectId },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'student_shs_eligibility',
        versionKey: false,
    },
);

export default mongoose.model('StudentShsEligibility', schema);
