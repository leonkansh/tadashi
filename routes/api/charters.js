/*
    Router handler for requests to:
        /api/charters
*/
import express from 'express';
import { verifyTeamMember } from '../authenticate.js';
var router = express.Router()

/* GET: /{orgid}/{teamid}
    Returns all charters for team number in organization
    Returns null if no charters found
    Team Member authentication required
*/
router.get('/:orgid/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            const charters = await req.db.Charter.findOne({
                orgid: req.params.orgid,
                teamid: req.params.teamid
            });
            if(charters != null) {
                res.send(charters.data);
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

/* POST: /{orgid}/{teamid}
    Post new charter for team number in organization
    Payload Body:
    {
        name: 'charter name',
        content: 'contents of charter',
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
                            name: req.body.name,
                            content: req.body.content,
                            meetingTimes: req.body.meetingTimes
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
        try {
            const charter = await req.db.Charter.findOne({
                orgid: req.params.orgid,
                teamid: req.params.teamid
            });
            for(let i = 0; i < charter.data.length; i++) {
                if (charter.data[i].name == req.body.name) {
                    charter.data[i].content = req.body.content;
                    charter.data[i].meetingTimes = req.body.meetingTimes;
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