/*
    Router handler for requests to:
        /api/teamAgreement
*/
import express from 'express';
var router = express.Router();

/* GET: /{orgid} 
    Return organization specified by id:
    {
        orgid: team.orgid,
        meetingTimes: team.meetingTimes,
        workload: workload distribution (String array),
        pulse: time of weekly pulse 
    }
*/
router.get('/:orgid', async (req, res) => {
    // console.log('sessionIsAuthenticated: ' + req.session.id)
    // if(req.session.isAuthenticated) {
        try {
            console.log('here');
            const orgid = req.params.orgid;
            const teamAgreement = await req.db.TeamAgreement.findOne({orgid: orgid});
            if (teamAgreement != null) {
                res.json({
                    status: 'success',
                    orgid: teamAgreement.orgid,
                    meetingTimes: teamAgreement.meetingTimes,
                    workload: teamAgreement.workload,
                    pulse: teamAgreement.pulse
                });
            } else {
                res.json({
                    status: 'error',
                    error: 'teamAgreement not created'
                });
            }
            
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

router.post('/create', async (req, res) => {
    // console.log('sessionIsAuthenticated: ' + req.session.id)
    // if(req.session.isAuthenticated) {
        try {
            console.log('here');
            await req.db.teamAgreement.create({
                
            });
            res.json({
                status: 'success',
                orgid: req.body.orgid,
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

router.put('/:orgid', async (req, res) => {
    // console.log('sessionIsAuthenticated: ' + req.session.id)
    // if(req.session.isAuthenticated) {
        try {
            console.log('here');
            const orgid = req.params.orgid;
            const teamAgreement = await req.db.TeamAgreement.findOne({orgid: orgid});
            let meetingTimes = req.body.meetingTimes ? req.body.meetingTimes : null;
            let pulse = req.body.pulse ? req.body.pulse : null;
            let workload = req.body.wordload ? req.body.workload : null;
            if(meetingTimes){
                teamAgreement.meetingTimes = meetingTimes;
            }
            if(workload){
                teamAgreement.workload = workload;
            }
            if(pulse){
                teamAgreement.pulse = pulse;
            }
            teamAgreement.save();
            res.json({
                status: 'success',
                orgid: teamAgreement.orgid,
                meetingTimes: teamAgreement.meetingTimes,
                workload: teamAgreement.workload,
                pulse: teamAgreement.pulse
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

router.delete('/:orgid', async (req, res) => {
    // console.log('sessionIsAuthenticated: ' + req.session.id)
    // if(req.session.isAuthenticated) {
        try {
            console.log('here');
            const orgid = req.params.orgid;
            await req.db.TeamAgreement.delete(
                {orgid: orgid}
            );
            res.json({
                status: 'success'
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


export default router;