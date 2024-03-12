import mongoose from 'mongoose';

export default async () => {
    const mongodbUri = process.env.MONGODB_URI;

    await mongoose.connect(mongodbUri);
};
