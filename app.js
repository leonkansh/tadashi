import express from 'express';
import path from 'path';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import indexRouter from './routes/index.js';
import db from './database/database.js';

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

app.use("/", indexRouter);

export default app;