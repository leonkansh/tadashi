import express from 'express';
import path from 'path';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import indexRouter from './routes/index.js';
import loginRouter from './routes/login.js';
import usersRouter from './routes/api/users.js';
import orgsRouter from './routes/api/org.js';

import db from './database/database.js';
import sessions from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use((req, res, next) => {
    req.db = db;
    next();
});

const oneDay = 1000 * 60 * 60 * 24;
const secret = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 25);
app.use(sessions({
    secret: secret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}));

// Temp account setup
app.use((req, res, next) => {
    let username = 3;
    req.session.userid = '621c7f364f7599e26f01ecd1';
    req.session.account = {
        username: username,
        name: `Test User: ${username}`
    }
    req.session.isAuthenticated = true;
    next();
});

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

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/api/users", usersRouter);
app.use("/api/org", orgsRouter);

export default app;