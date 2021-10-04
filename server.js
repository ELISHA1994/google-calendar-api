import * as http from "http";
import path from "path";
import express from "express";
import cors from "cors";
import { default as DBG } from 'debug';
import { default as logger } from "morgan";
import { default as rfs } from 'rotating-file-stream';
import { approotdir } from './approotdir.js';
import {basicErrorHandler, handle404, normalizePort, onError, onListening} from "./appsupport";
import * as handlers from "./handlers.js";

const debug = DBG('calendarapi:debug');
const __dirname = approotdir;




// Initialize the express app object
export const app = express();

// Middlewares setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'common', {
    stream: process.env.REQUEST_LOG_FILE || 'log.txt' ?
        rfs.createStream(process.env.REQUEST_LOG_FILE || 'log.txt', {
            size: '10M',     // rotate every 10 MegaBytes written
            interval: '1d',  // rotate daily
            compress: 'gzip',  // compress rotated files
            path: path.join(__dirname, 'logs')
        })
        : process.stdout
}));

// Health Check Route
app.get('/', function (req, res, next) {
    return res.status(200).send('Server is up and running !!!')
})
// For backend development testing
app.get('/getAuthURL', handlers.getAuthURL)
// End-Points
app.post('/getToken', handlers.getToken)
app.post('/getUserInfo', handlers.getUserInfo)
app.post('/getCalendarEvents', handlers.getCalendarEvents)
app.post('/getCalendarEvent/:id', handlers.getCalendarEvent)
app.put('/updateCalendarEvent/:id', handlers.updateCalendarEvent)
app.post('/deleteCalendarEvent/:id', handlers.deleteCalendarEvent)

// error handlers
// catch 404 and forward to error handler
app.use(handle404)
app.use(basicErrorHandler)

export const port = normalizePort(process.env.PORT || '1337')
app.set('port', port);

export const server = http.createServer(app);
server.listen(port);
server.on('request', (req, res) => {
    debug(`${new Date().toISOString()} request ${req.method}${req.url}`);
});
server.on('error', onError);
server.on('listening', onListening);
