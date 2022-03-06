import express from 'express';
import { verifyTeamMember } from '../authenticate.js';
var router = express.Router()

// GET: /{orgid}/{teamid} : retrieve all charters for team underneath org
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
            res.send(charters.data);
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

// POST: /{orgid}/{teamid} : post new charter for team underneath org
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

// PUT: /{orgid}/{teamid} : edit charter for team underneath org
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

// DELETE: /{orgid}/{teamid} : remove specific charter for team underneath org
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