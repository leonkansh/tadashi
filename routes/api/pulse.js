import express from 'express';
var router = express.Router();

/* GET: /:orgid
    Find the average of pulse results given the orgid and week number
    Payload body:
    {
        
    }
    User authentication required
*/
router.get('/:orgid/:week', async (req, res) => {
    // console.log('sessionIsAuthenticated: ' + req.session.id)
    // if(req.session.isAuthenticated) {
        try {
            console.log('here');
            const orgid = req.params.orgid;
            console.log(orgid);
            const weekNum = req.params.week;
            console.log(weekNum);
            const pulse = await req.db.Pulse.find({orgid: orgid, week: weekNum});
            console.log(pulse.length);
            let pulseResults = [];
            for (let i = 0; i< pulse.length; i++){
                console.log(pulse[i].userid);
                console.log(pulse[i].questions);
                let pulseResult = {
                    userid: pulse[i].userid,
                    questions: pulse[i].questions,
                    answers: pulse[i].answers
                }
                pulseResults.push(pulseResult);
            }
            res.json({
                status: 'success',
                pulseResult: pulseResults
            });
        } catch (error) {
            res.json({
                status: 'error',
                error: 'error'
            });
        }
    // } else {
    //     res.json({
    //         status: 'error',
    //         error: 'not authenticated'
    //     });
    // }
});

/* POST: /create/:orgid/:userid
    Create a new pulse
    Payload body:
    {
        pulse: auto-generated id of pulse
    }
    User authentication required
*/
router.post('/create/:orgid/:userid', async (req, res) => {
    try {
        // if (!req.session.isAuthenticated) {
        //     res.json({
        //         status: 'error',
        //         message: 'not authenticated'
        //     });
        // } else {
            let pulse = await req.db.Pulse.create({
                orgid: req.params.orgid,
                userid: req.params.userid,
                questions: req.body.questions,
                answers: req.body.answers,
                week: req.body.week
            });
            res.json({
                status: "success",
                pulseid: pulse._id
            });
        // }
    } catch (error) {
        res.json({
            status: 'error',
            error: '404'
        });
    }
});

export default router;
