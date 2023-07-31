const express = require('express');
const app = express();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const cors = require('cors');
const admin = require("firebase-admin");
const rateLimit = require("express-rate-limit");
// import axios
const axios = require('axios');

// Setup logger to log info and warning messages
const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';

// import sendSlackMessage
const { sendSlackMessage, signupSlackUser, unsubscribeNewsletterUser } = require('./utils/slack');

// Add cache
const apicache = require('apicache');
const cache = apicache.middleware;
// Log cache
apicache.options({
    debug: true
});



const NonProfitApplicationSubmitConfirmation = require('./src/components/NonProfitApplicationSubmitEmail/NonProfitApplicationSubmitConfirmation.js');              


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
        message: "100 Too many requests, please try again later. If this happens again, please send us an email at help@ohack.org.",
        keyGenerator: function (req) { return req.ip },
        handler: function (req, res) {
            logger.warn("Too many requests from IP: ", req.ip);
            return res.status(429).send("100 Too many requests, please try again later. If this happens again, please send us an email at help@ohack.org");
        },
        // skip for GET /api/nonprofit-application endpoint
        skip: function (req, res) {
            return req.path == "/api/nonprofit-application" || req.path == "/api/public/nonprofit-application";
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


app.get('/api/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

app.post('/api/slack-signup', function (req, res) {
    // Log the request
    logger.info('Request body: ', req.body);
    // Get email from request
    const email = req.body.email;
    
    return signupSlackUser(email);    
});

app.post('/api/unsubscribe', function (req, res) {
    // Log the request
    logger.info('Request body: ', req.body);
    // Get email from request
    const email = req.body.email;
    
    // Handle email empty or not set
    if (email == undefined || email == "" || email == null) {
        logger.warn("Email is empty or not set");
        return res.status(400).send("Email is empty or not set");
    }

    // Handle email not valid
    if (!email.includes("@")) {
        logger.warn("Email is not valid");
        return res.status(400).send("Email is not valid");
    }


    const slackCallback = (result) => {
        logger.info("Slack callback");
        if (result === "success" )
        {
            logger.info("Successfully unsubscribed");
            return res.status(200).send("Successfully unsubscribed");
        }
        else {
            logger.error("Error unsubscribing");
            return res.status(500).send("Error unsubscribing - please send us an email at help@ohack.org");
        }
    }
    
    unsubscribeNewsletterUser(email, slackCallback);
});


app.get('/api/nonprofit-applications', cache('5 minutes')  ,function (req, res) {

    // Log the request
    logger.info('/api/nonprofit-submit-applications Request body: ', req.body);
    // Get user id from request
    var user_slack_id = "";
    if( req.auth && req.auth.payload && req.auth.payload.sub ){
        user_slack_id = req.auth.payload.sub;
    }
    // log the user_id
    logger.info("User Slack ID:", user_slack_id);
    

    // Get all collectionRef from database, sorted by timestamp
    collectionRef
        .orderBy("timeStamp", "desc")
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                logger.info("No applications found");
                return res.status(404).send("No applications found");
            } else {
                // Return the first application found
                logger.info("Applications found, returning applications");
                var applications = [];
                querySnapshot.forEach((doc) => {                    
                    // Don't return certain fields like: contactPhone, contactEmail, contactName, ip, user_id, x_forwarded_for, x_ip_address
                    response = doc.data();
                    response.id = doc.id;
                    response.contactPhone = "";
                    response.contactEmail = "";
                    response.contactName = "";
                    response.ip = "";
                    response.user_id = "";
                    response.x_forwarded_for = "";
                    response.x_ip_address = "";
                    
                    applications.push(response);
                });                
                return res.json(applications);
            }
        }
        )
        .catch((error) => {
            logger.error(error);
            return res.status(500).send("Error retrieving applications");
        }
        );
});


        

                


app.post('/api/nonprofit-submit-application', function (req, res) {
    // Log the request
    logger.info('/api/nonprofit-submit-application Request body: ', req.body);
    
    const newApplication = req.body;
    const timeStamp = admin.firestore.Timestamp.now();
    const token = newApplication.token;

    // Check if Google CAPTCHA token is valid
    axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_CAPTCHA_SECRET}&response=${token}`)
        .then((response) => {
            // log the response
            logger.info("Google CAPTCHA response: ", response.data);
            // Check if Google CAPTCHA token is valid
            if (response.data.success) {
                logger.info("Google CAPTCHA token is valid");
            } else {
                logger.warn("Google CAPTCHA token is invalid");
                return res.status(400).send("231 Google CAPTCHA token is invalid  - please send us an email at help@ohack.org");
            }
        })
        .catch((error) => {
            logger.error("Error validating Google CAPTCHA token: ", error);
            return res.status(500).send("812 Error validating Google CAPTCHA token  - please send us an email at help@ohack.org");
        });

    // Get IP from Header    
    const ip = req.headers['x-ip-address'];
    logger.info("IP address: ", ip);
    const forwarded_for_ip = req.headers['x-forwarded-for'];
    logger.info("Forwarded for IP address: ", forwarded_for_ip);
    const user_agent = req.headers['user-agent'];
    logger.info("User agent: ", user_agent);

    var user_id = "";
    var user_slack_id = "";
    if (req.auth && req.auth.payload && req.auth.payload.sub) {
        logger.info("User is authenticated");
        // Get user id from request
        user_slack_id = req.auth.payload.sub;
        // Get the userid from user_slack_id oauth2|slack|T1Q7936BH-UC11XTRT11
        user_id = user_slack_id.split("|")[2].split("-")[1];
        // log the user_id
        logger.info("User ID of submitter: ", user_id);
    } else {
        logger.warn("User is not authenticated. Storing the application without user_id and user_slack_id, setting to IP address");      
        
        if( ip != undefined && ip != "" && ip != null ){
            user_id = ip;
            user_slack_id = ip;
        } else if (forwarded_for_ip != undefined && forwarded_for_ip != "" && forwarded_for_ip != null ){
            user_id = forwarded_for_ip;
            user_slack_id = forwarded_for_ip;
        } else {
            logger.warn("Could not obtain IP address.");
            
            
            return res.status(404).send("Unable to triagulate user - please send us an email at help@ohack.org");
        }        
    }
    
    newApplication.token = ""; // No need to store the CAPTCHA token    
    newApplication.timeStamp = timeStamp;
    newApplication.user_id = user_slack_id;
    newApplication.x_forwarded_for = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : "";
    newApplication.x_ip_address = req.headers['x-ip-address'] ? req.headers['x-ip-address'] : "";

    if (newApplication.contactPhone) {
        logger.info("Contact phone was provided");
        // See if this is an email address
        if (newApplication.contactPhone.includes("@")) {
            logger.info("Contact phone is an email address");

            var nameToUse = "";
            // See if there is a name
            if (newApplication.contactName) {
                logger.info("Contact name is present");
                nameToUse = newApplication.contactName;
            }

            // Extract out multiple email addresses with regex
            var emailAddresses = newApplication.contactPhone.match(/\S+@\S+\.\S+/g);
            logger.info("Email addresses: ", emailAddresses);
            // Loop through email addresses
            emailAddresses.forEach((emailAddress) => {
                logger.info("Email address: ", emailAddress);
                // Send Welcome Email
                const nonProfitApplicationSubmitConfirmation = new NonProfitApplicationSubmitConfirmation(nameToUse, emailAddress);
                nonProfitApplicationSubmitConfirmation.sendEmail();
            });
        } else {
            logger.info("Contact phone is not an email address");
        }
    }

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
                        return res.status(500).send("917 Error submitting application - please send us an email at help@ohack.org");
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
                            return res.status(500).send("381 Error updating application - please send us an email at help@ohack.org");
                        });                    
                });
            }
        }
        )
        .catch((error) => {
            console.error(error);
            return res.status(500).send("861 Error retrieving application - please send us an email at help@ohack.org");
        }
        );

});




function getApplication(res, user_id_query_param){
    logger.info("user_id_query_param: ", user_id_query_param);


    // Get application from database using user_slack_id
    collectionRef
        .where("user_id", "==", user_id_query_param)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                logger.info("Application not found for user, not returning anything");
                return res.status(404).send("Application not found");
            } else {
                // Return the first application found 
                logger.info("Application found for user, returning application");
                // If there are multiple applications, only return the first one                
                querySnapshot.forEach((doc) => {
                    // Only return the first one                    
                    return res.json(doc.data());
                });
            }
        }
        )
        .catch((error) => {
            logger.error(error);
            return res.status(500).send("291 Error retrieving application  - please send us an email at help@ohack.org");
        }
        );
}



app.get('/api/public/nonprofit-application', function (req, res) {
    // Log the request
    logger.info('/api/public/nonprofit-application Request body: ', req.body);
        
    // Get IP from Header    
    const ip = req.headers['x-ip-address'];
    logger.info("IP address: ", ip);
    const forwarded_for_ip = req.headers['x-forwarded-for'];
    logger.info("Forwarded for IP address: ", forwarded_for_ip);
    const user_agent = req.headers['user-agent'];
    logger.info("User agent: ", user_agent);
    
    var user_id_query_param = "";
    if (ip != undefined ** ip != "") {
        user_id_query_param = ip;
    } else if (forwarded_for_ip != undefined && forwarded_for_ip != "") {
        user_id_query_param = forwarded_for_ip;
    } else {
        logger.warn("Unable to triagulate user");
        return res.status(404).send("784 Unable to triagulate user - please send us an email at help@ohack.org");
    }
    return getApplication(res, user_id_query_param);
});

app.get('/api/nonprofit-application', checkJwt, function (req, res) {
    // Log the request
    logger.info('/api/nonprofit-application Request body: ', req.body);    
    // Get user id from request
    var user_slack_id = "";
    
    
    if( req.auth && req.auth.payload && req.auth.payload.sub ){
        user_slack_id = req.auth.payload.sub;
    }

    // log the user_id
    logger.info("User Slack ID:", user_slack_id);

    
    var user_id_query_param = "";
    if( user_slack_id != undefined && user_slack_id != "" ){
        user_id_query_param = user_slack_id;        
    } else {
        logger.warn("Unable to triagulate use by Slack ID");
        return res.status(404).send("219 Unable to triagulate user  - please send us an email at help@ohack.org");
    }

    return getApplication(res, user_id_query_param);
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