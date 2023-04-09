/*
    Routing handler for requests to:
        /api/users
*/
import express from 'express';
import { promises as fs } from 'fs';
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
                _id: self._id,
                standing : self.standing,
                major : self.major,
                MBTI : self.MBTI,
                phone : self.phone,
                workstyle : self.workstyle,
                profilePic: self.profilePic
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

router.put('/setpic', async (req, res) => {
    if(req.session.isAuthenticated) {
        try {
            const self = await req.db.User.findById(req.session.userid)
                .populate('orgs._id', '_id name')
                .populate('admin', '_id name');
            
            self.profilePic = req.body.image
            self.save()
            // file approach
            //let base64string = req.body.image
            //let base64image = base64string.split(';base64,').pop()
            //let dir = process.cwd();
            // fs.writeFile(`${dir}\\profile_pictures\\${self._id}.jpg`, base64image, {encoding: 'base64'}, function(err) {
            //     if(err) {
            //         return console.log(err);
            //     }
            // }); 
            res.json({
                status: 'success'
            })
        } catch (error) {
            // error is null for some reason
            console.log(error)
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
})

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
            standing : class standing,
            major : major,
            MBTI : MBTI,
            phone : phone number,
            workstyle : workstyle
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
        if (req.session.isAuthenticated) {
            res.json({
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                userType: user.userType,
                admin: user.admin,
                orgs: user.orgs,
                standing : user.standing,
                major : user.major,
                MBTI : user.MBTI,
                phone : user.phone,
                workstyle : user.workstyle,
                hasPic: user.hasPic  
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


/* GET: /{userid}
    body: standing, major, MBTI, phone, workstyle
    Return user information:
    {
        displayName : name,
        standing : class standing,
        major : major,
        MBTI : MBTI,
        phone : phone number,
        workstyle : workstyle
    }
*/

router.put('/information/:userid', async(req, res) => {
    try{
        const id = req.params.userid;
        const user = await req.db.User.findById(id);
        let standing = req.body.standing ? req.body.standing : null;
        let major = req.body.major ? req.body.major : null;
        let MBTI = req.body.MBTI ? req.body.MBTI : null;
        let phone = req.body.phone ? req.body.phone : null;
        let workstyle = req.body.workstyle ? req.body.workstyle : null;
        if(standing){
            console.log("here2");
            user.standing = standing;
            console.log(user.standing);
        }
        if(major){
            user.major = major;
        }
        if(MBTI){
            user.MBTI = MBTI;
        }
        if(phone){
            user.phone = phone;
        }
        if(workstyle){
            user.workstyle = workstyle;
        }
        user.save();
        res.json({
            status: 'success',
            // displayName: req.body.name,
            // standing : req.body.standing,
            // major : req.body.major,
            // MBTI : req.body.MBTI,
            // phone : req.body.phone,
            // workstyle : req.body.workstyle
        });
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
})


    
export default router;