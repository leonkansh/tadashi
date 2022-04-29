/*
    Router handler for requests to:
        /api/charters
*/
import express from 'express';
import { verifyTeamMember } from '../authenticate.js';
import baseCharters from '../baseCharters.js';
var router = express.Router()

/* GET: /{orgid}/{teamid}
    Returns all charters for team number in organization
    Returns null if no charters found
    Return:
    {
        _id: charter doc id,
        orgid: organization id,
        teamid: team id,
        __v: document version number (ignore),
        baseCount: number of base charters completed. >=3 all completed,
        data:
        [
            {
                completed: Boolean if charter is finished, false for init base,
                name: name of charter,
                content: inner details of charter,
                meetingTimes: [Date],
                _id: charter id
            }
        ]
    }
    Team Member authentication required
*/
router.get('/:orgid/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    console.log(req.session.userid, req.params.orgid, req.params.teamid)
    if(auth) {
        try {
            const charters = await req.db.Charter.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $setOnInsert: {
                        orgid: req.params.orgid,
                        teamid: req.params.teamid,
                        baseCount: 0,
                        data: baseCharters
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );
            if(charters != null) {
                res.send(charters);
            } else {
                res.send(null);
            }
        } catch(error) {
            res.json({
                status: 'error',
                error: 'oops'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authorized'
        });
    }
});

/* GET: /{orgid}/{teamid}/single?name="name"
    return single charter
*/
router.get('/:orgid/:teamid/single', async(req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let charterDoc = await req.db.Charter.findOne({
                orgid: req.params.orgid,
                teamid: req.params.teamid
            }).select({
                data: {
                    $elemMatch: {
                        name: req.query.name
                    }
                }
            });
            res.json(charterDoc);
        } catch (error) {
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

/*  @Deprecated Use PUT

    POST: /{orgid}/{teamid}
    Post new charter for team number in organization
    Payload Body:
    {
        name: 'charter name',
        goals: ,
        profile: ,
        meetingTimes: [Date] or null
    }
    Team Member authentication required
*/
router.post('/:orgid/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let goals = req.body.goals ? req.body.goals : null;
            let meetingTimes = req.body.meetingTimes ? req.body.meetingTimes : null;
            let profile = req.body.profile ? req.body.profile : null;
            await req.db.Charter.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $setOnInsert: {
                        orgid: req.params.orgid,
                        teamid: req.params.teamid
                    },
                    $push: {
                        data: {
                            completed: true,
                            name: req.body.name,
                            profile: profile,
                            goals: goals,
                            meetingTimes: meetingTimes
                        }
                    }
                },
                {
                    upsert: true
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
            error: 'not authorized'
        });
    }
});

/* PUT: /{orgid}/{teamid}
    Edit charter for team number in organization
    Payload Body:
    {
        name: 'target charter',
        content: 'updated charter content OR existing content',
        meetingTimes: [Date] or null
    }
    Team Member authentication required
*/
router.put('/:orgid/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        const baseNames = ['Meeting Times', 'Goals', 'Profile'];
        try {
            const charter = await req.db.Charter.findOne({
                orgid: req.params.orgid,
                teamid: req.params.teamid
            });
            let goals = req.body.goals ? req.body.goals : null;
            let meetingTimes = req.body.meetingTimes ? req.body.meetingTimes : null;
            let profile = req.body.profile ? req.body.profile : null;
            for(let i = 0; i < charter.data.length; i++) {
                if(charter.data[i].name == req.body.name) {
                    if(goals) {
                        charter.data[i].goals = goals;
                    }
                    if(meetingTimes) {
                        charter.data[i].meetingTimes = meetingTimes;
                    }
                    if(profile) {
                        charter.data[i].profile = profile;
                    }
                    if(!charter.data[i].completed) {
                        charter.data[i].completed = true;
                        charter.baseCount++;
                    }
                }
            }
            charter.save();
            res.json({
                status: 'success'
            });
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
            error: 'not authorized'
        });
    }
});

/* DELETE: /{orgid}/{teamid}
    Remove specific charter for team in organization
    Payload Body:
    {
        name: 'name of charter to remove'
    }
    Team Member authentication required
*/
router.delete('/:orgid/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            await req.db.Charter.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $pull: {
                        data: { name: req.body.name }
                    }
                }
            ).exec();
            res.json({
                status: 'success'
            });
        } catch (error) {
            console.log(error);
            res.json({
                status: 'error',
                error: 'oops'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authorized'
        });
    }
});

/*------ EXTRA COMMANDS ------*/
// GET: /template : retrieve template for new charter

// POST: /template : create new template for charters

export default router;