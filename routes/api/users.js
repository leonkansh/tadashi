/*
    Routing handler for requests to:
        /api/users
*/
import express from 'express';
var router = express.Router();

// Self, non-specifc query for session data
router.get('/self', async (req, res) => {
    console.log(req.session);
    if(req.session.isAuthenticated) {
        try {
            const self = await req.db.User.findById(req.session.userid)
                .populate('orgs._id', '_id name')
                .populate('admin', '_id name');
            res.json({
                status: 'success',
                email: self.email,
                displayName: self.displayName,
                userType: self.userType,
                admin: self.admin, 
                orgs: self.orgs,
                _id: self._id
            });
        } catch (error) {
            // error is null for some reason
            res.json({
                status: 'error',
                error: 'there was an unexpected error'
            });
        }
    } else {
        res.json({
            status: 'error',
            error: 'not authenticated'
        });
    }
});

/* GET: /{userid}
        Returns a user profile based on a specified user id, containing
        {
            email: 'email address',
            displayName: 'users display name'
        }
        If requested user is authenticated returns above in addition:
        {
            admin: [
                _id: org id of owned organization,
                name: name of owned organization
            ]
            orgs: [
                {
                    _id:
                    {
                        _id: org id of joined organization
                        name: name of joined organization
                    }
                }
                name: name of joined organization (outdated)
                teamid: id of team within organization
            ]
        }
        Note: If user is not assigned a team, teamid will be non-existent
*/
router.get('/:userid', async (req, res) => {
    try {
        const sessionUserId = req.session.userid;
        const userid = req.params.userid;
        let user = await req.db.User.findById(userid)
            .populate('orgs._id', '_id name')
            .populate('admin', '_id name')
            .exec();
        if (sessionUserId == userid) {
            res.json({
                email: user.email,
                displayName: user.displayName,
                userType: user.userType,
                admin: user.admin,
                orgs: user.orgs
            });
        } else { 
            res.json({
                email: user.email,
                displayName: user.displayName
            });
        }
    } catch(error) {
        res.json({
            status: 'error',
            error: '404'
        })
    }
});

/* PUT: /{userid}
    Edit specified users profile
    Payload Body:
    {
        name: 'Users new display name'
    }
    User authentication required for specified account
*/
router.put('/:userid', async (req, res) => {
    try {
        const sessionUserId = req.session.userid;
        const userid = req.params.userid;
        const user = await req.db.User.findByIdAndUpdate(
            userid,
            { displayName: req.body.name }
        );
        if (sessionUserId == userid) {
            user.save();
            res.json({
                status: 'success',
                displayName: req.body.name,
                admin: user.admin,
                orgs: user.orgs
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
            error: '404'
        });
    }
});

/* DELETE: /{userid}
    Delete specified user from database
    User authentication required for specified account
*/
router.delete('/:userid', async(req, res) => {
    try {
        if(req.session.isAuthenticated) {
            if(req.session.userid != req.params.userid) {
                res.json({
                    status: 'error',
                    message: 'improper credentials'
                });
            } else {
                await req.db.User.findByIdAndUpdate(
                    req.session.userid,
                    {
                        email: '[deleted]',
                        displayName: '[deleted]'
                    }
                ).exec();
                res.redirect('/signout');
            }
        } else {
            res.json({
                status: 'error',
                message: 'not authenticated'
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            message: 'oof'
        })
    }
});
    
export default router;