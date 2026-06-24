import mongoose from "mongoose";

const BASE_RETRY_MS = 5000;
const MAX_RETRY_MS = 30000;

let listenersBound = false;
const bindConnectionLogging = () => {
    if (listenersBound) return;
    listenersBound = true;
    mongoose.connection.on("disconnected", () =>
        console.warn("[db] disconnected — the driver will attempt to reconnect"));
    mongoose.connection.on("reconnected", () =>
        console.log("[db] reconnected"));
    mongoose.connection.on("error", (err) =>
        console.error("[db] connection error:", err.message));
};

// Connects to MongoDB, retrying with capped backoff instead of exiting. A
// transient failure (e.g. Atlas mid-election / a dropped idle connection) no
// longer crashes the process; once the initial connection is up, the driver
// auto-reconnects after any later drop.
export const connectDB = async () => {
    bindConnectionLogging();

    let delay = BASE_RETRY_MS;
    while (true) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log("MONGODB connected successfully ");
            return;
        } catch (error) {
            console.error(`[db] connection failed (${error.message}); retrying in ${delay / 1000}s`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, MAX_RETRY_MS);
        }
    }
};

export default connectDB;
