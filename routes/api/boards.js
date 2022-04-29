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
                let ownedCheck = false;
                if(req.session.userid == post.poster) {ownedCheck = true;}
                returnPosts.push(
                    {
                        _id: post._id,
                        owned: ownedCheck,
                        date: post.date,
                        title: post.title,
                        content: post.content,
                        reactions: post.reactions
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
                            content: req.body.content,
                            reactions: []
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

/* POST: /{orgid}/{teamid}/react
    React to a post
    Payload Body:
    {
        emoji: emoji string character,
        postid: _id of post being reacted to
    }
*/
router.post('/:orgid/:teamid/react', async (req, res) => {
    let auth = verifyTeamMember(
        req.session.userid,
        req.params.orgid,
        req.params.teamid,
        req.db
    );
    if(auth) {
        try {
            let boardDoc = await req.db.Board.findOne({
                orgid: req.params.orgid,
                teamid: req.params.teamid
            }).select({
                posts: {
                    $elemMatch: {
                        _id: req.body.postid
                    }
                }
            });
            let index = -1;
            for(let i = 0; i < boardDoc.posts[0].reactions.length; i++) {
                let emojiNumber = boardDoc.posts[0].reactions[i].emoji.codePointAt(0);
                let suppliedNumber = req.body.emoji.codePointAt(0);
                if (emojiNumber == suppliedNumber) {
                    index = i;
                }
            }
            if (index == -1) {
                boardDoc.posts[0].reactions.push({
                    emoji: req.body.emoji,
                    users: [req.session.userid]
                });
            } else {
                let emojiItem = boardDoc.posts[0].reactions[index];
                let userIndex = emojiItem.users.indexOf(req.session.userid);
                if (userIndex == -1) {
                    boardDoc.posts[0].reactions[index].users.push(req.session.userid);
                } else {
                    boardDoc.posts[0].reactions[index].users.splice(userIndex, 1);
                    if (boardDoc.posts[0].reactions[index].users.length == 0) {
                        boardDoc.posts[0].reactions.splice(index, 1);
                    }
                }
            }
            boardDoc.save();
            res.json(boardDoc.posts[0].reactions);
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