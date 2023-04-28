import express from 'express';
import path from 'path';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import indexRouter from './routes/index.js';
import loginRouter from './routes/login.js';
import usersRouter from './routes/api/users.js';
import orgsRouter from './routes/api/org.js';
import chartersRouter from './routes/api/charters.js';
import assignmentsRouter from './routes/api/assignments.js';
import messagesRouter from './routes/api/msg.js';
import boardsRouter from './routes/api/boards.js';
import userProfileRouter from './routes/api/userprofile.js';
import teamAgreementRouter from './routes/api/teamAgreement.js';
import pulseRouter from './routes/api/pulse.js'
import cors from 'cors';
import dotenv from 'dotenv';
import msIdExpress from 'microsoft-identity-express';

import db from './database/database.js';
import sessions from 'express-session';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var app = express();

/**
 * CRITICAL REFERENCE:
 * https://stackoverflow.com/questions/42710057/fetch-cannot-set-cookies-received-from-the-server
 * https://stackoverflow.com/a/63105481
 */
app.set('trust proxy', 1);
app.use(logger('dev'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use((req, res, next) => {
    req.db = db;
    next();
});

const appSettings = {
    appCredentials: {
        clientId:  "dd0cd16f-9890-4630-92ec-03ad70a24be1",
        tenantId:  "f6b6dd5b-f02f-441a-99a0-162ac5060bd2",
        clientSecret:  "KEA8Q~f0KdisC_zKNaFIt957g9q.35yYHW1O2aeI"
    },
    authRoutes: {
        redirect: "http://localhost:3001/redirect",
        error: "/error",
        unauthorized: "/unauthorized"
    }
};

const oneDay = 1000 * 60 * 60 * 24;
const secret = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 25);
app.use(sessions({
    name: 'tadashi',
    secret: secret,
    saveUninitialized: true,
    cookie: {
        // uncomment this after deploying
        //secure: true,
        httpOnly: false,
        maxAge: oneDay
        // this one too
        //sameSite: 'none'
    },
    resave: false
}));

app.use(cors({
    // origin: ['https://tadashi-app.herokuapp.com', 'https://tadashi-cli.herokuapp.com'],
    origin: 'http://localhost:3000',
    credentials: true
}));

// Unsure if necessary, but kept for stability reasons
/*
app.get('/s', async (req, res) => {
    res.cookie('tadashi', req.session.id, {httpOnly:false});
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.send('set');
});
*/

app.use((req, res, next) => {
    // console.log('**************')
    // console.log('\n SESSION ID: \n')
    // console.log(req.sessionID);
    // console.log('**************')
    // console.log('\n\n');

    // console.log('**************')
    // console.log('\n SESSION: \n')
    // console.log(req.session);
    // console.log('**************')
    // console.log('\n\n');

    // console.log('**************')
    // console.log('\n HEADERS: \n')
    // console.log(req.headers);
    // console.log('**************')
    // console.log('\n\n');

    // console.log('**************')
    // console.log('\n RAW HEADERS: \n')
    // console.log(req.rawHeaders);
    // console.log('**************')
    // console.log('\n\n');

    console.log('**************')
    console.log('\n URL: \n')
    console.log(req.url);
    console.log('**************')
    console.log('\n\n');

    console.log('**************')
    console.log('\n BODY: \n')
    console.log(req.body);
    console.log('**************')
    console.log('\n\n');

    // console.log('**************')
    // console.log('\n COOKIES: \n')
    // console.log(req.cookies);
    // console.log('**************')
    // console.log('\n\n');
    next();
});

// For testing, fixes user
// app.use((req, res, next) => {
//     let username = process.env.logged_username;
//     req.session.userid = process.env.logged_uid;
//     req.session.account = {
//         username: `${username}@uw.edu`,
//         name: username
//     }
//     req.session.isAuthenticated = true;
//     next();
// });


/* For SSO Implementation
// GET: /signin : Microsoft SSO, redirects to '/login'
app.get('/signin', (req, res) => {
    let username = req.query.id; // Temp call /signin?id={id}
    req.session.account = {
        username: username,
        name: `Test User: ${username}`
    }
    req.session.isAuthenticated = true;
    res.redirect('/login');
});

// GET: /signout : call auth provider to sign out this user
app.get('/signout', (req, res) => {
   // TEMP : replicate MS signin
   req.session.userid = -1;
   req.session.isAuthenticated = false;
   res.redirect('/');
});
*/

const msid = new msIdExpress.WebAppAuthClientBuilder(appSettings).build();
app.use(msid.initialize());

app.get('/signin',
    msid.signIn({postLoginRedirect: '/login'})
)
app.get('/signout',
    msid.signOut({postLogoutRedirect: '/'})
)

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/api/users", usersRouter);
app.use("/api/org", orgsRouter);
app.use("/api/charters", chartersRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/msg", messagesRouter);
app.use("/api/board", boardsRouter);
app.use("/api/userprofile", userProfileRouter);
app.use("/api/teamAgreement", teamAgreementRouter);
app.use("/api/pulse", pulseRouter);

export default app;