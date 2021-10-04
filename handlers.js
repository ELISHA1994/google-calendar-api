import { google } from "googleapis";
import credentials from "./config/credentials";
import { default as DBG } from 'debug';


const debug = DBG('calendarapi:debug');


// Google Credentials
const client_id = credentials.web.client_id;
const redirect_uris = credentials.web.redirect_uris

// Create a new instance of oAuth and set our Client ID & Client Secret.
const oAuth2Client = new google.auth.OAuth2(
    client_id,
    process.env.CLIENT_SECRET,
    redirect_uris[1]
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
        const decoded = decodeURIComponent(req.body.code)
        const token = await oAuth2Client.getToken(decoded);
        // console.log(token.res.data);
        return res.json(token.res.data);
    } catch (err) {
        console.log(err)
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
            timeMin: (new Date()).toISOString(),
            // maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime'
        })
        // console.log(events.data.items.length);
        res.json(events.data.items);
    } catch (err) {
        next(err);
    }
}

export async function getCalendarEvent(req, res, next) {
    try {
        if (req.body.token === null) return res.status(400).json('Token not found');
        await oAuth2Client.setCredentials(req.body.token);

        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const eventId = req.params.id;

        const event = await calendar.events.get({
            calendarId: 'primary',
            eventId: eventId
        });
        // console.log(event.data);
        res.json(event.data);
        // const event
    } catch (err) {
        next(err);
    }
}


export async function updateCalendarEvent(req, res, next) {
    try {
        if (req.body.token === null) return res.status(400).json('Token not found');
        await oAuth2Client.setCredentials(req.body.token);

        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const eventId = req.params.id;

        const updates = req.body.fields;

        const updatedEvent = await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: {...updates}
        })
        // console.log(updatedEvent.data);
        res.json(updatedEvent.data);
    } catch (err) {
        console.error(err);
        next(err);
    }
}

export async function deleteCalendarEvent(req, res, next) {
    try {
        if (req.body.token === null) return res.status(400).json('Token not found');
        await oAuth2Client.setCredentials(req.body.token);

        // Create a new calender instance.
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const eventId = req.params.id;

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        // console.log(response);
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}
