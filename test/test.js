import nodemailer from 'nodemailer';
import cron from 'node-cron';

let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'chimunotification@gmail.com',
        pass: 'niwawnxzlxfqhlur'
    }
});

let emails = ["marquito@uw.edu", "mark20020822@gmail.com"];

let mailOptions = {
    from: 'chimunotification@gmail.com',
    to: emails,
    subject: 'Test Email sent by Node.js',
    text: 'Test Test'
};

let second = 1;
let minute = 29;
let hour = 23;
let day = 1;
let dayOfMonth = '*';
let month = '*';


// cron.schedule(`${second} ${minute} ${hour} ${dayOfMonth} ${month} ${day}`, () => {
//     transporter.sendMail(mailOptions, function(error, info){
//     if (error) {
//         console.log(error);
//     } else {
//         console.log('Email sent: ' + info.response);
//     }
//     });
// });

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});