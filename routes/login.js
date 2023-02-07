import express from 'express';
import crypto from 'crypto';
var router = express.Router();

/*
    Redirect post SSO signin
        adds user to database if new
        adds userid to session
        redirects to '/'
*/
/* FOR Microsoft SSO
router.get('/', async (req, res) => {
    try {
        const options = {
            returnDocument: 'after',
            upsert: true
        }

        let user = await req.db.User.findOneAndUpdate(
            { email: req.session.account.username },
            { $setOnInsert: {
                email: req.session.account.username,
                displayName: req.session.account.name
            }},
            options
        );

        req.session.userid = user._id;
        res.redirect('/') // Landing page
    } catch (error) {
        res.json({
            status: 'error',
            error: 'sad face'
        });
    }
});
*/

/* Signs in user and sets session
    Payload:
    {
        email: email,
        password: password
    }
*/
router.post('/signin', async(req, res) => {
    if(req.session.isAuthenticated) {
        res.json({
            status: 'error',
            error: 'already authenticated'
        });
    } else {
        try {
            const user = await req.db.User.findOne({email: req.body.email})
                .populate('orgs._id', '_id name')
                .populate('admin', '_id name')
                .exec();
            const status = verifyPassword(req.body.password, user.hash, user.salt);
            if(status) {
                req.session.isAuthenticated = true;
                req.session.account = {
                    username: user.email,
                    name: user.displayName
                }
                req.session.userid = user._id;
                console.log(user.userType)
                res.json({
                    status: 'success',
                    authenticated: req.session.isAuthenticated,
                    _id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    userType: user.userType,
                    admin: user.admin,
                    orgs: user.orgs
                });
                
            } else {
                res.json({
                    status: 'error',
                    error: 'incorrect password'
                });
            }
            
        } catch (error) {
            console.log(error)
            res.json({
                status: 'error',
                error: 'incorrect email'
            });
        }
    }
});

/* Signs up user with new account, logs in immediately
    Payload:
    {
        email: emailed used for registration,
        password: password used for registration,
        name: name used for display,
        userType: admin user or normal user
    }
*/
router.post('/signup', async(req, res) => {
    if(req.session.isAuthenticated) {
        res.json({
            status: 'error',
            error: 'already logged in'
        });
    } else {
        try {
            const nameCheck = await req.db.User.find({ email: req.body.email }).exec();
            if(nameCheck.length != 0) {
                res.json({
                    status: 'error',
                    error: 'name already exists'
                });
            } else {
                const saltHash = hashPassword(req.body.password);
                const options = {
                    returnDocument: 'after',
                    upsert: true
                }
                let user = await req.db.User.findOneAndUpdate(
                    { email: req.body.email },
                    { $setOnInsert: {
                        email: req.body.email,
                        displayName: req.body.name,
                        userType: req.body.usertype,
                        salt: saltHash.salt,
                        hash: saltHash.hash
                    }},
                    options
                );
                req.session.isAuthenticated = true;
                req.session.account = {
                    username: user.email,
                    name: user.displayName
                }
                req.session.userid = user._id

                res.json({
                    status: 'success',
                    authenticated: req.session.isAuthenticated,
                    _id: req.session.userid,
                    email: user.email,
                    displayName: user.displayName,
                    userType: user.usertype,
                    admin: [],
                    orgs: []
                });
            }
        } catch(error) {
            console.log(error);
            res.json({
                status: 'error',
                error: 'oops'
            })
        }
    }
});

/* Removes users credentials
*/
router.post('/signout', async (req, res) => {
    req.session.isAuthenticated = false;
    req.session.account = null;
    req.session.userid = null;
    res.json({status: 'success'});
});

function hashPassword(password) {
    try {
        const salt = crypto.randomBytes(128).toString('base64');
        const iterations = 10000;
        let obj = { salt: salt };
        return {
            hash:  crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('base64'),
            salt: salt
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

function verifyPassword(password, hash, salt) {
    const temp = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');
    return temp == hash;
}

export default router;