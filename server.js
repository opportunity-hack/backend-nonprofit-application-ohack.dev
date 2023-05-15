const express = require('express');
const app = express();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const cors = require('cors');
const admin = require("firebase-admin");

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

app.post('/api/nonprofit-submit-application', checkJwt, function (req, res) {
    // Log the request
    logger.info('Request body: ', req.body);

    // Return 404 for testing
    // res.status(404).send("Application not found");
    
    const newApplication = req.body;
    const timeStamp = admin.firestore.Timestamp.now();

    // Get user id from request
    const user_slack_id = req.auth.payload.sub;    

    newApplication.timeStamp = timeStamp;
    newApplication.user_id = user_slack_id;

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