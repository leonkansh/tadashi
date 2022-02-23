import express from 'express';
var router = express.Router();

/*
    Redirect post SSO signin
        adds user to database if new
        adds userid to session
        redirects to '/'
*/
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

export default router;