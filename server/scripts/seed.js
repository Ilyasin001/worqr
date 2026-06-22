// Seeds a self-contained demo company so you can log in and explore the UI.
// Safe to re-run: it removes the existing demo company (by code) and its data,
// then recreates everything. It only touches the demo company.
//
// Usage (from server/):  node scripts/seed.js
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { pathToFileURL } from "url";

import Company from "../src/models/company.js";
import User from "../src/models/user.js";
import Event from "../src/models/event.js";
import Shift from "../src/models/shift.js";
import Assignment from "../src/models/assignment.js";
import PayrollBatch from "../src/models/payrollBatch.js";
import RefreshToken from "../src/models/refreshToken.js";

export const DEMO_CODE = "DEMO2024";
export const PASSWORD = "Password1";

const daysFromNow = (d, h = 9) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(h, 0, 0, 0);
    return date;
};

// Seeds the demo company. Assumes mongoose is already connected. Returns the
// login credentials so callers can print them.
export async function seedDemo() {
    // --- wipe any previous demo data (scoped to the demo company only) -------
    const existing = await Company.findOne({ code: DEMO_CODE });
    if (existing) {
        const cid = existing._id;
        await Promise.all([
            User.deleteMany({ company: cid }),
            Event.deleteMany({ company: cid }),
            Shift.deleteMany({ company: cid }),
            Assignment.deleteMany({ company: cid }),
            PayrollBatch.deleteMany({ company: cid }),
            RefreshToken.deleteMany({ company: cid }),
        ]);
        await Company.deleteOne({ _id: cid });
        console.log("Removed previous demo company data.");
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // --- company + admin ----------------------------------------------------
    const companyId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    const company = await Company.create({
        _id: companyId,
        name: "Demo Events Co",
        code: DEMO_CODE,
        owner: adminId,
    });

    const admin = await User.create({
        _id: adminId,
        name: "Alex Admin",
        email: "admin@demo.test",
        passwordHash,
        role: "admin",
        company: companyId,
        hourlyRate: 25,
        isVerified: true,
    });

    // --- staff --------------------------------------------------------------
    const staff = await User.create([
        { name: "Sam Staff", email: "sam@demo.test", passwordHash, role: "staff", company: companyId, hourlyRate: 14, isVerified: true },
        { name: "Riley Staff", email: "riley@demo.test", passwordHash, role: "staff", company: companyId, hourlyRate: 13.5, isVerified: false },
    ]);

    // --- events -------------------------------------------------------------
    const events = await Event.create([
        { title: "Summer Music Festival", description: "Main stage operations", date: daysFromNow(7, 12), address: "Hyde Park, London", createdBy: adminId, company: companyId, status: "confirmed" },
        { title: "Corporate Awards Gala", description: "Black-tie dinner service", date: daysFromNow(14, 18), address: "The Grand Hotel", createdBy: adminId, company: companyId, status: "pending" },
    ]);

    // --- shifts -------------------------------------------------------------
    const shifts = await Shift.create([
        { managerId: adminId, eventId: events[0]._id, company: companyId, startTime: daysFromNow(7, 9), endTime: daysFromNow(7, 17), confirmed: true },
        { managerId: adminId, eventId: events[1]._id, company: companyId, startTime: daysFromNow(14, 16), endTime: daysFromNow(14, 23), confirmed: false },
    ]);

    // --- assignments --------------------------------------------------------
    await Assignment.create([
        { shiftId: shifts[0]._id, staffId: staff[0]._id, company: companyId, hourlyRate: 14, breakDuration: 30 },
        { shiftId: shifts[1]._id, staffId: staff[1]._id, company: companyId, hourlyRate: 13.5, breakDuration: 0 },
    ]);

    return { code: DEMO_CODE, adminEmail: admin.email, staffEmail: staff[0].email, password: PASSWORD };
}

export function printCreds(creds) {
    console.log("\n✅ Demo data seeded.\n");
    console.log("   Company:     Demo Events Co");
    console.log(`   Join code:   ${creds.code}`);
    console.log("   ----------------------------------------");
    console.log(`   ADMIN login: ${creds.adminEmail}  /  ${creds.password}`);
    console.log(`   STAFF login: ${creds.staffEmail}    /  ${creds.password}`);
    console.log("   ----------------------------------------\n");
}

// CLI entry: connect to the configured MONGO_URI, seed, print, exit.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set. Add it to server/.env first.");
        process.exit(1);
    }
    mongoose
        .connect(process.env.MONGO_URI)
        .then(async () => {
            console.log("Connected to MongoDB.");
            const creds = await seedDemo();
            printCreds(creds);
            await mongoose.connection.close();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error("Seed failed:", err.message);
            try { await mongoose.connection.close(); } catch {}
            process.exit(1);
        });
}
