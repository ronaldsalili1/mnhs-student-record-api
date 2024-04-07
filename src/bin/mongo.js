import mongoose from 'mongoose';

export default async () => {
    const mongodbUri = process.env.MONGODB_URI;
    const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

    try {
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        console.log('[!] MongoDB connecting...');
        await mongoose.connect(mongodbUri, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log('[!] MongoDB connected');
    } catch (error) {
        throw new Error(error.message);
    }
};
