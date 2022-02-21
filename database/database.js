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

    const orgSchema = new mongoose.Schema({
        name: String,
        admin: Schema.Types.ObjectId, // userid
        description: String, // can be empty
        members: [Schema.Types.ObjectId], // [userid]
        teams: { // intialize null
            id: Number,
            name: String,
            members: [Schema.Types.ObjectId] // [userid]
        }
    });

    const msgSchema = new mongoose.Schema({
        orgid: Schema.Types.ObjectId, // orgid
        teamid: Number,
        message: [{
            date: Date,
            sender: Schema.Types.ObjectId, // userid
            content: String,
            flag: Number // 0: no hl, 1: meeting, 2: important
        }]
    });

    const assignmentSchema = new mongoose.Schema({
        orgid: Schema.Types.ObjectId, // orgid
        assignments: [{
            name: String, // Name of assginment
            description: String,
            data: [{
                teamid: Number,
                leader: Schema.Types.ObjectId, // userid
                todos: [{
                    content: String, // Content of todo
                    userid: Schema.Types.ObjectId, // userid
                    date: Date,
                    completed: Boolean
                }]
            }]
        }]
    });

    const charterSchema = new mongoose.Schema({
        orgid: Schema.Types.ObjectId, // orgid
        teamid: Number,
        data: [{
            name: String,
            content: String,
            meetingTimes: [Date] // leave null if not meeting times
            // if needed, add extra fields and leave null
        }]
    });

    // const postBoardSchema = new mongoose.Schema({
    //     orgid: Schema.Types.ObjectId, // orgid
    //     teamid: Number,
    //     date: Date,
    //     expiration: Date, // date + time
    //     content: String
    // });

    db.User = mongoose.model('User', userSchema);
    db.Org = mongoose.model('Org', orgSchema);
    db.Msg = mongoose.model('Msg', msgSchema);
    db.Assignment = mongoose.model('Assignment', assignmentSchema);
    db.Charter = mongoose.model('Charter', charterSchema);
    // db.Board = mongoose.model('Board', postBoardSchema);
}

export default db;