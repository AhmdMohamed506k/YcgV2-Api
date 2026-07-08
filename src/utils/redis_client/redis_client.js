import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();


const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis successfully');
    } catch (error) {
        console.error('❌ Could not connect to Redis', error);
    }
};

connectRedis();

export default redisClient;