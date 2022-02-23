import express from 'express';
var router = express.Router();

// TODO: Validate all
// GET: /{userid} : returns a user profile
router.get('/:userid', async (req, res) => {
    try {
        let sessionUserId = req.session.userid;
        let userid = req.params.userid;
        let user = await req.db.User.findById({userid}).exec();
        if (sessionUserId == userid) {
            res.json({
                email: user.email,
                displayName: user.displayName,
                orgs: user.orgs
            })
        } else { 
            res.json({
                email: user.email,
                displayName: user.displayName
            })
        }
    } catch(error) {
        res.json({
            status: 'error',
            error: '404'
        })
    }
});

// PUT: /{userid} : edit a user profile
    // user authentication is required
router.put('/:userid', async (req, res) => {
    try {
        let sessionUserId = req.session.userid;
        let userid = req.params.userid;
        let user = await req.db.User.findById({userid}).exec();
        if (sessionUserId == userid) {
            res.json({
                displayName: req.displayName,
                orgs: user.orgs
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

// DELETE: /{userid} : drop user from database, done by setting fields to empty
router.delete('/:userid', async(req, res) => {
    try {
        if(req.session.isAuthenticated) {
            if(req.session.userid != req.params.userid) {
                res.json({
                    status: 'error',
                    message: 'improper credentials'
                });
            }
            await req.db.User.findByIdAndUpdate(
                req.session.userid,
                {
                    email: '[deleted]',
                    displayName: '[deleted]'
                }
            ).exec()
            res.redirect('/signout');
        }
        res.json({
            status: 'error',
            message: 'not authenticated'
        })
    } catch (error) {
        res.json({
            status: 'error',
            message: 'oof'
        })
    }
});
    
// GET: /{userid}/connections : return a list of users whom this user works with

// POST: /{usrid}/connections/add?user=[id] : add a user to this user by id
    // user authentication is required

// DELETE: /{usrid}/connections/remove?user=[id] : delete a connected user to this user by id
    // user authentication is required

export default router;