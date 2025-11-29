
import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
    if(isConnected) {
        console.log('Already connected to database')
        return;
    }

    try{
        const db = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,

        })
        isConnected = db.connections[0].readyState
        console.log('New connection to database established')
    }catch (err){
        if(err instanceof Error)
        console.error(err.message)
        throw err;
    }
}