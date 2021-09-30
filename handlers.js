import { google } from "googleapis";
import credentials from "./config/credentials";
import { default as DBG } from 'debug';
const debug = DBG('calendarapi:debug');


// Google Credentials
const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirect_uris = credentials.web.redirect_uris

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
);

const Scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.settings.readonly",
    "https://www.googleapis.com/auth/userinfo.profile"
]

export async function getAuthURL(req, res, next) {
    try {
        const authURL = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: Scopes
        })
        // console.log(authURL);
        return res.json(authURL);
    } catch(err) {
        next(err)
    }
}

export async function getToken(req, res, next) {
    try {
        if (req.body.code === null) return res.status(400).json('Bad Request');
        const token = await oAuth2Client.getToken(req.body.code);
        // console.log(token);
        return res.json(token)
    } catch (err) {
        next(err)
    }
}

export async function getUserInfo(req, res, next) {
    try {
        if (req.body.token === null) return res.status(400).json('Token not found');
        await oAuth2Client.setCredentials(req.body.token);
        const oauth2 = await google.oauth2({ version: 'v2', auth: oAuth2Client});
        const response = await oauth2.userinfo.get();
        res.send(response.data);
    } catch(err) {
        next(err)
    }

}

export async function getCalendarEvents(req, res, next) {
    try {
        if (req.body.token === null) return res.status(400).json('Token not found');
        await oAuth2Client.setCredentials(req.body.token);
        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMax: (new Date()).toISOString(),
            maxResults: 30,
            singleEvents: true,
            orderBy: 'startTime'
        })
        // console.log(events.data.items)
        res.json(events.data.items);
    } catch (err) {
        next(err);
    }
}

export async function userEvents (req, res, next) {
    try {
        let code = req.headers.authorization
        code = code.replace(/^Bearer /i, '')
        const token = await oAuth2Client.getToken(code);

        await oAuth2Client.setCredentials(token);
        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 30,
            singleEvents: true,
            orderBy: 'startTime'
        })
        res.json(events.data.items);
    } catch (err) {
        next(err);
    }
}

export async function events(req, res, next) {
    try {
        let {token} = req.body
        console.log('refreshToken', token);
        oAuth2Client.setCredentials({
            refresh_token: token
        })

        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 30,
            singleEvents: true,
            orderBy: 'startTime'
        })
        console.log(events);
        res.json(events)
    } catch (err) {
        console.error(err);
        next(err);
    }
}


// const tkn = req.body.token;
// let results = [];
// // If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// // The file token.json stores the user's access and refresh tokens, and is
// // created automatically when the authorization flow completes for the first
// // time.
// const TOKEN_PATH = 'token.json';
//
// // Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//     if (err) return console.log('Error loading client secret file:', err);
//     // Authorize a client with credentials, then call the Google Calendar API.
//     authorize(JSON.parse(content), listEvents);
// });
//
// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
//     const {client_secret, client_id, redirect_uris} = credentials.web;
//     const oAuth2Client = new google.auth.OAuth2(
//         client_id,
//         client_secret,
//         redirect_uris[0]
//     );
//
//     // Check if we have previously stored a token.
//     fs.readFile(TOKEN_PATH, (err, token) => {
//         if (err) return getAccessToken(oAuth2Client, callback);
//         oAuth2Client.setCredentials(JSON.parse(token));
//         callback(oAuth2Client);
//     });
// }
//
// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback for the authorized client.
//  */
// function getAccessToken(oAuth2Client, callback) {
//     oAuth2Client.getToken(tkn, (err, token) => {
//         if (err) return console.error('Error retrieving access token', err);
//         oAuth2Client.setCredentials(token);
//         // Store the token to disk for later program executions
//         fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//             if (err) return console.error(err);
//             console.log('Token stored to', TOKEN_PATH);
//         });
//         callback(oAuth2Client);
//     });
// }
//
// /**
//  * Lists the next 10 events on the user's primary calendar.
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// async function listEvents(auth) {
//     async function func() {
//         const calendar = await google.calendar({version: 'v3', auth});
//         calendar.events.list({
//             calendarId: 'primary',
//             timeMin: (new Date()).toISOString(),
//             maxResults: 10,
//             singleEvents: true,
//             orderBy: 'startTime',
//         }, (err, res) => {
//             if (err) return console.log('The API returned an error: ' + err);
//             const events = res.data.items;
//             if (events.length) {
//                 console.log('Upcoming 10 events:', events);
//                 events.map((event, i) => {
//                     results.push(event);
//                 });
//             } else {
//                 console.log('No upcoming events found.');
//             }
//         });
//     }
//     await func();
// }
// res.json(results);



// configure a JWT auth client
// let jwtClient = new google.auth.JWT(
//     'elishabello2014@gmail.com',
//     null,
//     privatekey.private_key,
//     [
//         'https://www.googleapis.com/auth/calendar'
//     ]
// );
//authenticate request
// await jwtClient.authorize()
// let calendar = google.calendar('v3');
// const response = await calendar.events.list({
//     auth: jwtClient,
//     calendarId: 'primary'
// })
// console.log(response)
// const events = response.items;
// await calendar.events.list({
//     auth: jwtClient,
//     calendarId: 'primary'
// }, function (err, response) {
//     if (err) {
//         console.log('The API returned an error: ' + err);
//         return;
//     }
//     var events = response.items;
//     if (events.length == 0) {
//         console.log('No events found.');
//     } else {
//         console.log('Event from Google Calendar:');
//         for (let event of response.items) {
//             console.log('Event name: %s, Creator name: %s, Create date: %s', event.summary, event.creator.displayName, event.start.date);
//         }
//     }
// });
