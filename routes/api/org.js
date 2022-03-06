import express from 'express';
var router = express.Router();

/* POST: /create : create an organization
        user authentication is required
*/
router.post('/create', async (req, res) => {
    try {
        if (!req.session.isAuthenticated) {
            res.json({
                status: 'error',
                message: 'not authenticated'
            });
        } else {
            let org = await req.db.Org.create({
                name: req.body.name,
                admin: {
                    _id: req.session.userid,
                    name: req.session.account.name
                },
                description: req.body.description,
                accessCode: req.body.accessCode
            });

            await req.db.User.findByIdAndUpdate(
                req.session.userid,
                { $push: { 
                    admin: {
                        _id: org._id,
                        name: org.name
                    }
                }
            }).exec();
            res.json({
                status: "success"
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

/* GET: /{orgid} : return the organization description, teams, ...
        add information as needed
*/
router.get('/:orgid', async (req, res) => {
    try {
        const orgid = req.params.orgid;
        let org = await req.db.Org.findById(orgid);
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

// PUT: /{orgid} : edit the organization description and name
    // admin authentication is required
router.put('/:orgid', async (req, res) => {
    try {
        const sessionUserId = req.session.userid;
        const orgid = req.params.orgid;
        await req.db.Org.findOneAndUpdate(
            { 
                _id: orgid,
                "admin._id": sessionUserId
            },
            {
                name: req.body.name,
                description: req.body.description
            }
        ).exec();
        res.json({
            status: 'success'
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    };
});

// DELETE: /{orgid} : delete the entire organization
    // user authentication is required
router.delete('/:orgid', async (req, res) => {
    if (!req.session.isAuthenticated) {
        res.json({
            status: 'error',
            message: 'not authenticated'
        })
    } else {
        try {
            // Authenticate
            const orgid = req.params.orgid;
            const org = await req.db.Org.findById(orgid);
            if (org.admin._id == req.session.userid) {
                // Pull user list
                let members = org.members;

                // Delete from user orgs list FIXME: Not validated
                members.forEach(uid => {
                    req.db.User.findByIdAndUpdate(
                        uid,
                        { $pull:
                            {
                                "orgs._id": orgid
                            }
                        }
                    ).exec();
                });

                await req.db.User.findByIdAndUpdate(
                    org.admin._id,
                    { $pull: {
                        admin: { _id: orgid }
                    }
                }).exec();

                /*
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
                */

                await req.db.Org.deleteOne({
                    _id: orgid
                });
                
                res.json({
                    status: 'success'
                });
            } else {
                res.json({
                    status: 'error',
                    error: 'not authenticated'
                });
            }
        } catch (error) {
            res.json({
                status: 'error',
                error: 'oof'
            });
        }
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
    } else {
        try {
            const sessionUserId = req.session.userid;
            const orgid = req.params.orgid;
            const accessCode = req.body.accessCode;
            let org = await req.db.Org.findById(
                orgid,
            );
            if (org.accessCode == accessCode) {
                let user = await req.db.User.findByIdAndUpdate(
                    sessionUserId,
                    { $push: {
                    orgs: {
                        _id: orgid
                    }
                }});
                await req.db.Org.findByIdAndUpdate(
                    orgid,
                    { $push: {
                        members: {
                            _id: sessionUserId,
                            name: user.displayName
                        }
                    }}
                ).exec();
                await user.save();
                res.json({
                    status: 'success'
                });
            } else {
                res.json({
                    status: 'error',
                    error: 'incorrect access code'
                });
            }
        } catch (error) {
            res.json({
                status: 'error',
                error: '404'
            });
        }
    }
});

// POST: /{orgid}/leave : remove a user from this org
    // user themselves only
router.post('/:orgid/leave', async (req, res) => {
    if (req.session.isAuthenticated) {
        const sessionUserId = req.session.userid;
        const orgid = req.params.orgid;
        try {
            // delete from user.team
            await req.db.User.findByIdAndUpdate(
                sessionUserId,
                {
                    $pull: {
                        orgs: { _id: orgid }
                    }
                }
            ).exec();

            // delete from org.teams.members
            await req.db.Org.findByIdAndUpdate(
                orgid,
                {
                    $pull: {
                        "teams.$[].members": { _id: sessionUserId }
                    } 
                }  
            ).exec();

            // delete from org.members
            await req.db.Org.findByIdAndUpdate(
                orgid,
                {
                    $pull: { members: { _id: sessionUserId } }
                }  
            ).exec();

            res.json({
                status: 'success'
            });
                
        } catch (error) {
            res.json({
                status: 'error',
                error: '404'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});

// GET: /{orgid}/members : return a list of members in this org
router.get('/:orgid/members', async (req, res) => {
    try {
        const orgid = req.params.orgid;
        let org = await req.db.Org.findById(orgid).exec();
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

// POST: /{orgid}/kick : 
    // body: targetUser = userid
    // admin only
router.post('/:orgid/kick', async (req, res) => {
    if (req.session.isAuthenticated) {
        const sessionUserId = req.session.userid;
        const targetUser = req.body.targetUser;
        const orgid = req.params.orgid;
        try {
            let org = await req.db.Org.findById(orgid);
            if (org.admin._id == sessionUserId) {
                // delete from user.team
                await req.db.User.findByIdAndUpdate(
                    targetUser,
                    {
                        $pull: {
                            orgs: { _id: orgid }
                        }
                    }
                ).exec();

                // delete from org.teams.members
                await req.db.Org.findByIdAndUpdate(
                    orgid,
                    {
                        $pull: { 
                            "teams.$[].members": {_id: targetUser }
                        }
                    }  
                ).exec();
                

                // delete from org.members
                await req.db.Org.findByIdAndUpdate(
                    orgid,
                    {
                        $pull: { members: { _id: targetUser } }
                    }  
                ).exec();

                res.json({
                    status: 'success'
                });
            } else {
                res.json({
                    status: 'error',
                    error: 'improper credentials'
                });
            }
        } catch (error) {
            res.json({
                status: 'error',
                error: '404'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    } 
});

// POST: /{orgid}/teams/random : put the entire org into random teams
router.post('/:orgid/teams/random', async (req, res) => {
    if (req.session.isAuthenticated) {
        try {
            const userid = req.session.userid;
            const orgid = req.params.orgid;
            let org = await req.db.Org.findById(orgid);
            if (org.admin._id == userid) {
                const teamSize = req.body.teamSize;
                const members = org.members;
                let teams = []; 
                let remainingStudents = members.length;
                while (remainingStudents > 0) {
                    let newTeam = [];
                    for(let i = 0; i < teamSize; i++) {
                        if (remainingStudents > 0) {
                            newTeam.push(members[remainingStudents - 1]);
                            remainingStudents--;
                        }
                    }
                    console.log(remainingStudents)
                    console.log(newTeam)
                    if (newTeam.length != 0) {
                        teams.push(newTeam);
                    }
                }
                for (let i = 0; i < teams.length; i++) {
                    let tempTeam = {
                        members: teams[i],
                        teamid: i + 1,
                        name: `Team ${i + 1}`
                    }
                    org.teams.push(tempTeam)
                    teams[i].forEach(mem => {
                        req.db.User.findByIdAndUpdate(
                            mem._id,
                            {
                                '$set': {
                                    'orgs.$[el].teamid': i + 1,
                                    'orgs.$[el].name': `Team ${i + 1}`
                                }
                            },
                            {
                                arrayFilters: [{ 'el._id': orgid }]
                            }
                        ).exec();
                    });
                }
                await org.save();
                res.json({
                    status: 'success'
                });
            } else {
                res.json({
                    status: 'error',
                    error: 'improper credentials'
                });
            }
        } catch (error) {
            res.json({
                status: 'error',
                error: '404'
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