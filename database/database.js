import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
main().catch(err => console.log(err));

let db = {};

async function main() {
    // Establish connection
    await mongoose.connect(process.env.MONGODB_URI);

    const userSchema = new mongoose.Schema({
        email: String,
        displayName: String
    });

    db.User = mongoose.model('User', userSchema);
}

export default db;