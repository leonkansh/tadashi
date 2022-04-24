/*
    Routing handler for requests to:
        /api/org
*/
import express from 'express';
import { verifyTeamMember, retrieveTeamMembers } from '../authenticate.js';
var router = express.Router();

/* POST: /create
    Create a new organization, sets logged user as administrator
    Payload body:
    {
        name: 'organizations name',
        description: 'organizations description',
        accessCode: 'organizations access code'
    }
    User authentication required
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
                admin: req.session.userid,
                description: req.body.description,
                accessCode: req.body.accessCode
            });

            await req.db.User.findByIdAndUpdate(
                req.session.userid,
                { 
                    $push:
                    { 
                        admin: org._id
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

/* GET: /{orgid} 
    Return organization specified by id:
    {
        name: 'organization name',
        admin: 'administrator's name',
        description: 'organizations description,
        members: [joined members],
        teams: [formed teams]
    }
    If authorized as admin of organization, returns in addition to above:
    {
        accessCode: 'organizations access code'
    }
*/
router.get('/:orgid', async (req, res) => {
    try {
        const orgid = req.params.orgid;
        const org = await req.db.Org.findById(orgid)
            .populate('admin', '_id displayName')
            .populate('members', '_id displayName');
        let accessCode = null;
        if(org.admin._id == req.session.userid) {
            accessCode = org.accessCode;
        }
        res.json({
            name: org.name,
            admin: org.admin.displayName,
            description: org.description,
            members: org.members,
            teams: org.teams,
            accessCode: accessCode
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

/* PUT: /{orgid}
    Edit the organization, by id, description and name
    Payload Body:
    {
        name: 'new organization name',
        description: 'new organization description'
    }
    Admin authentication required
*/
router.put('/:orgid', async (req, res) => {
    try {
        const sessionUserId = req.session.userid;
        const orgid = req.params.orgid;
        await req.db.Org.findOneAndUpdate(
            { 
                _id: orgid,
                admin: sessionUserId
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

/* DELETE: /{orgid}
    Delete the organization by id
    Admin authentication required
*/
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
            if (org.admin == req.session.userid) {
                // Pull user list
                let members = org.members;

                // FIXME: Not validated
                // Delete from user orgs list
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
                        admin: orgid
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

/* POST: /{orgid}/join
    Adds logged user to specified organization.
    Payload Body:
    {
        accessCode: 'organizations access code'
    }
    User authentication required
*/
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
            let org = await req.db.Org.findById(orgid);
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
                    {
                        $push:
                        {
                            members: sessionUserId
                        }
                    }
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

/* POST: /{orgid}/leave
    Remove logged in user from specified organization
    User authentication required
*/
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
                        "teams.$[].members": sessionUserId
                    } 
                }  
            ).exec();

            // delete from org.members
            await req.db.Org.findByIdAndUpdate(
                orgid,
                {
                    $pull: { members: sessionUserId }
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

/* GET: /{orgid}/members
    Return a list of members specified organization
*/
router.get('/:orgid/members', async (req, res) => {
    try {
        const orgid = req.params.orgid;
        let org = await req.db.Org.findById(orgid)
            .populate('members', '_id displayName')
            .exec();
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

/* POST: /{orgid}/kick
    Remove a user from specified organization
    Payload Body:
    {
        targetUser: 'user id of user to be removed'
    }
    Admin authentication required
*/
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
                            "teams.$[].members": targetUser
                        }
                    }  
                ).exec();
                

                // delete from org.members
                await req.db.Org.findByIdAndUpdate(
                    orgid,
                    {
                        $pull: { members: targetUser }
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

/* POST: /{orgid}/teams/random
    Randomize all joined members of specified into teams
    Payload Body:
    {
        teamSize: Integer specifying desired team sizes
    }
    Admin authentication required
*/
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
                            mem,
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

/* GET: /{orgid}/team/{teamid}
    Returns members of the associated team within an organization
    Requires authentication and team membership.
    Return Payload:
    {
        _id: id of organization,
        teams: [
            {
                members: [
                    {
                        _id: user id of member,
                        email: email of member,
                        displayName: user name of member
                    }
                ]
            },
            teamid: id of team in organization,
            name: name of team in organization,
            _id: internal id of team in organization
        ]
    }
*/
router.get('/:orgid/team/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let team = await req.db.Org.findById(req.params.orgid)
                .select({
                    teams: {
                        $elemMatch: {
                            teamid: req.params.teamid
                        }
                    }
                })
                .populate('teams.members', '_id displayName email');
            res.send(team);
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

/* PUT: /{orgid}/team/{teamid}
    Edit team name
    {
        teamName: new team name
    }
    Requires team authentication
*/
router.put('/:orgid/team/:teamid', async (req, res) => {
    let auth = await verifyTeamMember(
            req.session.userid,
            req.params.orgid,
            req.params.teamid,
            req.db
    );
    if(auth) {
        try {
            let team = await req.db.Org.findById(req.params.orgid)
                .select({
                    teams: {
                        $elemMatch: {
                            teamid: req.params.teamid
                        }
                    }
                });
            team.teams[0].name = req.body.teamName
            team.save()

            team.teams[0].members.forEach(async (member) => {
                let memDoc = await req.db.User.findById(member);
                let index = -1;
                for(let i = 0; i < memDoc.orgs.length; i++) {
                    if(memDoc.orgs[i]._id == req.params.orgid) {
                        index = i
                    }
                }
                memDoc.orgs[index].name = req.body.teamName;
                memDoc.save();
            });

            res.json({
                status: 'success'
            });
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

export default router;