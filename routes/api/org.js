/**
 * TODO: validate all
 */
import express from 'express';
var router = express.Router();

// POST: /create : create an organization
    // user authentication is required
router.post('/create', async (req, res) => {
    try {
        if (!req.session.isAuthenticated) {
            res.json({
                status: 'error',
                message: 'not authenticated'
            });
        }

        let org = await req.db.Org.create({
            name: req.body.name,
            admin: {
                id: req.session.userid,
                name: req.session.account.name
            },
            description: req.body.description,
            accessCode: req.body.accessCode
        });

        res.json({
            status: "success"
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// GET: /{orgid} : return the organization description, teams, ...
    // add information as needed
router.get('/:orgid', async (req, res) => {
    try {
        let orgid = req.params.orgid;
        let org = await req.db.Org.findById({orgid});
        res.json({
            name: org.name,
            admin: org.admin.name,
            description: org.description,
            members: org.members,
            teams: org.teams
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// PUT: /{orgid} : edit the orgnization info
    // admin authentication is required
router.put('/:orgid', async (req, res) => {
    try {
        let sessionUserId = req.session.userid;
        let orgid = req.params.orgid;
        let org = await req.db.Org.findOneAndUpdate(
            { 
                orgid: org.orgid,
                admin: { id: sessionUserId }
            },
            {
                name: req.body.name,
                admin: req.body.admin.name,
                description: req.body.description,
                members: req.body.members,
                teams: req.body.teams
            }
        );

    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    };
});

// DELETE: /{orgid} : delete the entire orgnization
    // user authentication is required
router.delete('/:orgid', (req, res) => {
    if (!req.session.isAuthenticated) {
        res.json({
            status: 'error',
            message: 'not authenticated'
        })
    }
    try {
        // Authenticate
        const orgid = req.params.orgid;
        const org = await req.db.Org.findById(orgid);
        if (org.admin.id == req.session.account.username) {
            // Pull user list
            let members = org.members;

            // Delete from user orgs list
            members.forEach(uid => {
                await req.db.User.findByIdAndUpdate(
                    uid,
                    { $pull:
                        {
                            "orgs.org": orgid
                        }
                    }
                ).save();
            });

            // Delete msg
            await req.db.Msg.deleteOne(
                { 'orgid': orgid }
            );

            // Delete assignment
            await req.db.Assignment.deleteOne(
                { 'orgid': orgid }
            );

            // Delete charter
            await req.db.Charter.deleteOne(
                { 'orgid': orgid }
            );
            
            res.json({
                status: 'success'
            });
        } else {
            res.json({
                status: 'error',
                error: 'not authenticated'
            })
        }
    } catch (error) {

    }
});

// POST: /{orgid}/join : add a user to this org
    // user authentication is required
router.post('/:orgid/join', async (req, res) => {
    if (!req.session.isAuthenticated) {
        res.json({
            status: 'error',
            message: 'not authenticated'
        })
    }

    try {
        let sessionUserId = req.session.userid;
        let orgid = req.params.orgid;
        let org = await req.db.Org.findOneAndUpdate(
            {
                orgid: org.orgid,
                accessCode: req.body.accessCode
            },
            {
                name: req.body.name,
                admin: req.body.admin.name,
                description: req.body.description,
                members: req.body.members
            }
        );
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// POST: /{orgid}/leave : remove a user from this org
    // user themself only
router.post('/:orgid/leave', async (req, res) => {
    let userid = req.body.userid;
    let sessionUserId = req.session.userid;
    let orgid = req.params.orgid;
    try {
        let org = await req.db.Org.findById({orgid}).exec();
        if (sessionUserId != userid) {
            res.json({  
                status: 'failure',
                error: 'not oneself'
            });
        }
        // delete from user.team
        let user = await req.db.User.findById({userid}).exec();
        await req.db.User.findByIdAndUpdate(
            userid,
            {
                $pull: { "orgs.org": orgid }
            }
        ).save();
    
        // delete from org.teams.members
        await req.db.Org.findByIdAndUpdate(
            orgid,
            {
                $pull: { "teams.members": userid }
            }  
        ).save();

        // delete from org.members
        await req.db.Org.findByIdAndUpdate(
            orgid,
            {
                $pull: { "members": userid }
            }  
        ).save();
        
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        })
    }
});

// GET: /{orgid}/members : return a list of members in this org
router.get('/:orgid/members', async (req, res) => {
    try {
        let orgid = req.params.orgid;
        let org = await req.db.Org.findById({orgid}).exec();
        res.json({
            members: org.members
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// POST: /{orgid}/kick?user=[id] : 
    // admin only
router.post('/:orgid/kick', (req, res) => {
    let userid = req.query.userid;
    let sessionUserId = req.session.userid;
    let orgid = req.params.orgid;
    try {
        let org = await req.db.Org.findById({orgid}).exec();
        if (sessionUserId != org.admin.id) {
            res.json({
                status: 'failure',
                error: 'not admin'
            });
        }
        // delete from user.team
        let user = await req.db.User.findById({userid}).exec();
        await req.db.User.findByIdAndUpdate(
            userid,
            {
                $pull: { "orgs.org": orgid }
            }
        ).save();
        
        // delete from org.teams.members
        await req.db.Org.findByIdAndUpdate(
            orgid,
            {
                $pull: { "teams.members": userid }
            }
        ).save();

        // delete from org.members
        await req.db.Org.findByIdAndUpdate(
            orgid,
            {
                $pull: { "members": userid }
            }
        ).save();
        
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// TODO: POST: /{orgid}/teams/random : put the entire org into random teams

export default router;