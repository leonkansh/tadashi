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
import cors from 'cors';
import dotenv from 'dotenv';

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use((req, res, next) => {
    req.db = db;
    next();
});

const oneDay = 1000 * 60 * 60 * 24;
const secret = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 25);
app.use(sessions({
    name: 'tadashi',
    secret: secret,
    saveUninitialized: true,
    cookie: {
        secure: true,
        httpOnly: false,
        maxAge: oneDay,
        sameSite: 'none'
    },
    resave: false
}));

app.use(cors({
    origin: ['https://tadashi-app.herokuapp.com', 'https://tadashi-cli.herokuapp.com'],
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
    console.log('**************')
    console.log('\n SESSION ID: \n')
    console.log(req.sessionID);
    console.log('**************')
    console.log('\n\n');

    console.log('**************')
    console.log('\n SESSION: \n')
    console.log(req.session);
    console.log('**************')
    console.log('\n\n');

    console.log('**************')
    console.log('\n HEADERS: \n')
    console.log(req.headers);
    console.log('**************')
    console.log('\n\n');

    console.log('**************')
    console.log('\n RAW HEADERS: \n')
    console.log(req.rawHeaders);
    console.log('**************')
    console.log('\n\n');

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

    console.log('**************')
    console.log('\n COOKIES: \n')
    console.log(req.cookies);
    console.log('**************')
    console.log('\n\n');
    next();
});

/* For testing, fixes user
app.use((req, res, next) => {
    let username = process.env.logged_username;
    req.session.userid = process.env.logged_uid;
    req.session.account = {
        username: `${username}@uw.edu`,
        name: username
    }
    req.session.isAuthenticated = true;
    next();
});
*/

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

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/api/users", usersRouter);
app.use("/api/org", orgsRouter);
app.use("/api/charters", chartersRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/msg", messagesRouter);
app.use("/api/board", boardsRouter);

export default app;