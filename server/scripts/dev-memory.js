// Runs the real backend against a throwaway in-memory MongoDB and seeds demo
// data — handy for trying the app without a reachable MongoDB. Data is NOT
// persisted; it disappears when this process stops.
//
// Usage (from server/):  node scripts/dev-memory.js
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
// Set before importing the server so its dotenv.config() won't override it.
process.env.MONGO_URI = mongod.getUri();
console.log("In-memory MongoDB started.");

await import("../src/server.js"); // connects to MONGO_URI and starts listening

await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once("connected", resolve);
});

const { seedDemo, printCreds } = await import("./seed.js");
printCreds(await seedDemo());

console.log("Backend ready (in-memory). Data resets when this process stops.\n");
