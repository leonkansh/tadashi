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
        displayName: String,
        userType: String,
        hash: String,
        salt: String,
        admin: [{type: mongoose.Schema.Types.ObjectId, ref: "Org"}],
        orgs: [{
            _id: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
            name: String
        }],
        standing: String,
        major: String,
        MBTI: String,
        phone: String,
        workstyle: String
    });

    const userProfileSchema = new mongoose.Schema({
        userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        orgid: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        questions: [String],
        answers: [String],
    });

    const orgSchema = new mongoose.Schema({
        name: String,
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        description: String, // can be empty
        accessCode: String,
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        viewed: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] //initialized to null
    });

    const msgSchema = new mongoose.Schema({
        orgid: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        teamid: Number,
        message: [{
            date: Date,
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            content: String,
            flag: Number // 0: no hl, 1: meeting, 2: important
        }]
    });

    const assignmentSchema = new mongoose.Schema({
        orgid: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        assignments: [{
            name: String, // Name of assignment
            description: String,
            due: Date,
            data: [{
                teamid: Number,
                leader: {
                    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    name: String
                },
                todos: [{
                    content: String, // Content of todo
                    userid: {
                        _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                        name: String
                    },
                    date: Date,
                    completed: Boolean
                }]
            }]
        }]
    });

    const charterSchema = new mongoose.Schema({
        orgid: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        teamid: Number,
        baseCount: Number,
        data: [{
            completed: Boolean,
            name: String,
            profile: [{
                name: String,
                email: String,
                phone: String
            }],
            goals: [String],
            meetingTimes: [{
                name: String,
                weekday: Number,
                start: Number,
                end: Number
            }]
        }]
    });

    const teamAgreementSchema = new mongoose.Schema({
        org: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        teamGoals: [String],
        meetingTimes: [{
            weekday: String,
            startHour: String,
            startMinute: String,
            endHour: String,
            endMinute: String
        }],
        communicationChannels: [String],
        pulse: {
            weekday: String,
            hour: String,
            minute: String
        }
    })

    const postBoardSchema = new mongoose.Schema({
        orgid: { type: mongoose.Schema.Types.ObjectId, ref: "Org" },
        teamid: Number,
        posts: [{
            poster: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            date: Date,
            title: String,
            content: String,
            reactions: [{
                emoji: String,
                users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
            }]
        }]
    });

    db.User = mongoose.model('User', userSchema);
    db.Org = mongoose.model('Org', orgSchema);
    db.Msg = mongoose.model('Msg', msgSchema);
    db.Assignment = mongoose.model('Assignment', assignmentSchema);
    db.Charter = mongoose.model('Charter', charterSchema);
    db.Board = mongoose.model('Board', postBoardSchema);
    db.UserProfile = mongoose.model('UserProfile', userProfileSchema);
    db.TeamAgreement = mongoose.model('TeamAgreement', teamAgreementSchema);
}

export default db;