const express = require('express');
const app = express();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const cors = require('cors');
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");

// Setup logger to log info and warning messages
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';



require('dotenv').config();


if (!process.env.ISSUER_BASE_URL || !process.env.AUDIENCE || !process.env.FIREBASE_CERT_CONFIG || !process.env.FRONTEND_URL) {
    throw 'Make sure you have ISSUER_BASE_URL, FIREBASE_CERT_CONFIG, and AUDIENCE in your .env file';
}

const corsOptions = {
    origin: process.env.FRONTEND_URL
};

logger.info("CORS origin: ",corsOptions.origin);

app.use(cors(corsOptions));
app.use(express.json());

const limiter = rateLimit(
    { windowMs: 15 * 1000,
        max: 2,
        message: "Too many requests, please try again later.",
        keyGenerator: function (req) { return req.ip },
        handler: function (req, res) {
            logger.warn("Too many requests from IP: ", req.ip);
            return res.status(429).send("Too many requests, please try again later.");
        },
        // skip for GET /api/nonprofit-application endpoint
        skip: function (req, res) {
            return req.path == "/api/nonprofit-application";
        }  
    });
// Add limiter
app.use(limiter);

const checkJwt = auth();

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CERT_CONFIG)),
});

// Create a reference to a Cloud Firestore collection
const db = admin.firestore();
const collectionRef = db.collection("project_applications");

// import sendSlackMessage
const { sendSlackMessage } = require('./utils/slack');

app.get('/api/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

app.post('/api/nonprofit-submit-application', checkJwt, function (req, res) {
    // Log the request
    logger.info('Request body: ', req.body);

    // Return 404 for testing
    // res.status(404).send("Application not found");
    
    const newApplication = req.body;
    const timeStamp = admin.firestore.Timestamp.now();

    // Get user id from request
    const user_slack_id = req.auth.payload.sub;    
    // Get the userid from user_slack_id oauth2|slack|T1Q7936BH-UC11XTRT11
    const user_id = user_slack_id.split("|")[2].split("-")[1];
    // log the user_id
    logger.info("User ID of submitter: ", user_id);
    
    newApplication.timeStamp = timeStamp;
    newApplication.user_id = user_slack_id;

    // convert newApplication to string
    newApplicationString = JSON.stringify(newApplication);
    // format newApplicationString
    newApplicationString = newApplicationString.replace(/,/g, ",\n");
    // format json newApplicationString
    newApplicationString = "```" + newApplicationString + "```";

    collectionRef
        .where("user_id", "==", user_slack_id)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // Create a new application
                collectionRef
                    .add(newApplication)
                    .then((docRef) => {
                        logger.info("New application created successfully, id: ", docRef.id);
                        sendSlackMessage(`Hey <@${user_id}>, we have received your application.  If you need to change anything, head over to https://ohack.dev/nonprofits/apply`, user_id);
                        sendSlackMessage(`New application submitted by <@${user_id}> ${newApplicationString}`, "C058JEXPEAJ");

                        return res.json({ message: docRef.id });                        
                    })
                    .catch((error) => {
                        logger.error("Error submitting application: ", error);
                        return res.status(500).send("Error submitting application");
                    });

            } else {
                querySnapshot.forEach((doc) => {
                    // Update existing application
                    collectionRef
                        .doc(doc.id)
                        .update(newApplication)
                        .then(() => {
                            logger.info("Application updated successfully, id: ", doc.id);
                            
                            sendSlackMessage(`Hey <@${user_id}>, we have received your _updated_ application.  If you need to change anything, head over to https://ohack.dev/nonprofits/apply`, user_id);
                            sendSlackMessage(`Updated application submitted by <@${user_id}> ${newApplicationString}`, "C058JEXPEAJ");
                            return res.json({ message: doc.id });                            
                        })
                        .catch((error) => {
                            logger.error("Error updating application: ", error);
                            return res.status(500).send("Error updating application");
                        });                    
                });
            }
        }
        )
        .catch((error) => {
            console.error(error);
            return res.status(500).send("Error retrieving application");
        }
        );

});

app.get('/api/nonprofit-application', checkJwt, function (req, res) {
    // Log the request
    logger.info('Request body: ', req.body);

    // Return 404 for testing
    // res.status(404).send("Application not found");        

    // Get user id from request
    const user_slack_id = req.auth.payload.sub;

    console.log("User Slack ID", user_slack_id);

    // Get application from database using user_slack_id
    collectionRef
        .where("user_id", "==", user_slack_id)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                logger.info("Application not found for user, not returning anything");
                return res.status(404).send("Application not found");
            } else {
                // Return the first application found 
                logger.info("Application found for user, returning application");               
                querySnapshot.forEach((doc) => {
                    return res.json(doc.data());                    
                    
                });
            }
        }
        )
        .catch((error) => {
            logger.error(error);
            return res.status(500).send("Error retrieving application");
        }   
        );
});


app.get('/api/private-scoped', checkJwt, requiredScopes('read:messages'), function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
    });
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    return res.set(err.headers).status(err.status).json({ message: err.message });
});

port = process.env.PORT || 3010
app.listen(port);
console.log('Listening on port' + port + '/api/');