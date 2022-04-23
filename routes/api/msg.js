/*
    Router handler for requests to:
        /api/msg
*/
import express from "express";
import { verifyTeamMember } from "../authenticate.js";
let router = express.Router();

/* GET: /{orgid}/{teamid}
    Retrieve message history for team in organization
    Instances messages on first call
    Return:
    [
        {
            date: Date,
            sender:
            {
                _id: 'user id',
                name: 'user name'
            },
            content: 'message content',
            flag: Number; flag associated for highlighting 0 - no hl, 1 - meeting, 2 - important
        }
    ]
*/
router.get('/:orgid/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            const messageDoc = await req.db.Msg.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $setOnInsert: {
                        orgid: req.params.orgid,
                        teamid: req.params.teamid,
                        message: []
                    }
                },
                {
                    upsert: true,
                    returnDocument: 'after'
                }
            ).populate('message.sender', '_id displayName');
            res.send(messageDoc.message);
        } catch(error) {
            console.log(error);
            res.json({
                status: 'error',
                error: 'oops'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});

/* POST: /{orgid}/{teamid}
    Post message for team in organization
    Payload Body:
    {
        date: Date; send date,
        content: 'message content',
        flag: Number; flag associated for highlighting 0 - no hl, 1 - meeting, 2 - important
    }
*/
router.post('/:orgid/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            await req.db.Msg.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $push:
                    {
                        message:
                        {
                            date: req.body.date,
                            sender: req.session.userid,
                            content: req.body.content,
                            flag: req.body.flag
                        }
                    }
                }
            );
            res.json({ status: 'success' });
        } catch(error) {
            console.log(error);
            res.json({
                status: 'error',
                error: 'oops'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});
export default router;