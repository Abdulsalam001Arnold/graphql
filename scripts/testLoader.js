
// scripts/testDataLoader.js
import {userLoader} from "../src/loaders/userLoader.js";
import {connectDB} from "../src/db/connect.js";
import dotenv from 'dotenv';

dotenv.config();
await connectDB();

const loader = userLoader();

console.log('Testing DataLoader...\n');

// Simulate loading same user multiple times
const userId = '507f1f77bcf86cd799439011'; // Replace with real ID

console.time('First load (cache miss)');
const user1 = await loader.load(userId);
console.timeEnd('First load (cache miss)');
console.log('User:', user1.name);

console.time('Second load (cache hit)');
const user2 = await loader.load(userId);
console.timeEnd('Second load (cache hit)');
console.log('User:', user2.name);

console.log('\n✅ Second load should be instant (cached)');

process.exit(0);