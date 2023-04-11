/*
    Router handler for requests to:
        /api/teamAgreement
*/
import express from 'express';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
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
                    teamGoals: teamAgreement.teamGoals,
                    meetingTimes: teamAgreement.meetingTimes,
                    communicationChannels: teamAgreement.communicationChannels,
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
            const orgid = req.body.orgid;
            
            let org = await req.db.Org.findById(orgid);

            let teamGoals = req.body.teamGoals;

            let meetingTimesArr = req.body.meetingTimes;
            let meetingTimes = [];
            for (let i = 0; i < meetingTimesArr.length; i++) {
                let content = {
                    weekday: meetingTimesArr[i][0],
                    startHour: meetingTimesArr[i][1],
                    startMinute: meetingTimesArr[i][2],
                    endHour: meetingTimesArr[i][3],
                    endMinute: meetingTimesArr[i][4]
                }
                meetingTimes.push(content)
            }

            let communicationChannels = req.body.communicationChannels;

            let pulseArr = req.body.pulse;

            // let pulseArr = [];
            // pulseArr[0] = 2;
            // pulseArr[1] = 0;
            // pulseArr[2] = 51;

            let pulse = {
                weekday: pulseArr[0],
                hour: pulseArr[1],
                minute: pulseArr[2]
            };

            // schedule send email
            let members = org.members;
            let memberEmails = [];
            for (let i = 0; i < members.length; i++){
                let member = await req.db.User.findById(members[i]);
                let memberEmail = member.email;
                memberEmails.push(memberEmail);
            }

            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'chimunotification@gmail.com',
                    pass: 'niwawnxzlxfqhlur'
                }
            });
            
            let mailOptions = {
                from: 'chimunotification@gmail.com',
                to: memberEmails,
                subject: 'Test Email sent by Node.js',
                text: 'Test Test'
            };
            
            let second = 1;
            let minute = pulse.minute;
            let hour = pulse.hour;
            let day = pulse.weekday;
            let dayOfMonth = '*';
            let month = '*';
            
            cron.schedule(`${second} ${minute} ${hour} ${dayOfMonth} ${month} ${day}`, () => {
                transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
                });
            });            

            let teamAgreement = await req.db.TeamAgreement.create({
                org : org,
                teamGoals: teamGoals,
                meetingTimes: meetingTimes,
                communicationChannels: communicationChannels,
                pulse: pulse
            });
            res.json({
                status: 'success',
                orgid: teamAgreement.orgid,
                teamAgreementid: teamAgreement._id
            });
        } catch (error) {
            console.log(error)
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