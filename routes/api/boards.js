/*
    Router handler for requests to:
        /api/board
*/
import express from "express";
import { verifyTeamMember } from "../authenticate.js";
let router = express.Router();

/* GET: /{orgid}/{teamid}
    Retrieve all posts from team board
    Return:
    [
        {
            _id: 'post id',
            date: Date posted,
            title: 'title of post',
            content: 'contents of post on board'
        }
    ]
*/
router.get('/:orgid/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            const boardDoc = await req.db.Board.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $setOnInsert: {
                        orgid: req.params.orgid,
                        teamid: req.params.teamid,
                        posts: []
                    }
                },
                {
                    upsert: true,
                    returnDocument: 'after'
                }
            );
            boardDoc.posts.sort((a, b) => b.date - a.date);
            let returnPosts = [];
            for(const post of boardDoc.posts) {
                returnPosts.push(
                    {
                        _id: post._id,
                        date: post.date,
                        title: post.title,
                        content: post.content
                    }
                );
            }
            res.send(returnPosts);
        } catch(error) {
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

/* POST: /{orgid}/{teamid}
    Send new post to the team board
    Payload Body:
    {
        date: Date of post,
        title: 'title of post',
        content: 'content of post'
    }
*/
router.post('/:orgid/:teamid', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            await req.db.Board.findOneAndUpdate(
                {
                    orgid: req.params.orgid,
                    teamid: req.params.teamid
                },
                {
                    $push: {
                        posts: {
                            poster: req.session.userid,
                            date: req.body.date,
                            title: req.body.title,
                            content: req.body.content
                        }
                    }
                }
            ).exec();
            res.json({ status: 'success' });
        } catch(error) {
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