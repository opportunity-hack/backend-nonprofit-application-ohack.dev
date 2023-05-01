// Import required libraries
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");
const serviceAccount = require("./firebase-service-account.json");
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Load environment variables
require("dotenv").config();

const corsOptions = {
  origin: process.env.CORSROUTE,
};

// Initialize Firebase Admin SDK with service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Create a reference to a Cloud Firestore collection
const db = admin.firestore();
const collectionRef = db.collection("project_applications");

// Create an API endpoint that retrieves data from the Cloud Firestore collection
app.get("/get-application/:id", (req, res) => {
  // Replace the variable id with req.params.id
  const id = "8sTrAJpHTw68No6QC9d4";
  const documentRef = collectionRef.doc(id);

  documentRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        res.status(404).send("Application not found");
      } else {
        res.json(doc.data());
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving application");
    });
});

app.post("/submit-application", cors(corsOptions), (req, res) => {
  const newApplication = req.body;

  const timeStamp = admin.firestore.Timestamp.now();

  newApplication.timeStamp = timeStamp;

  collectionRef
    .add(newApplication)
    .then((docRef) => {
      res.json({ id: docRef.id });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error submitting application");
    });
});

app.put("/update-application/:id", (req, res) => {
  // Replace documentId variable with req.params.id
  const documentId = "8sTrAJpHTw68No6QC9d4";
  // replace updatedData variable with req.body
  const updatedData = {
    charityName: "api_test",
    location: "api_test",
    understandProjectUncertainty: true,
    areasOfFocus: ["Education", "Arts & Culture"],
    servedPopulations: ["Women", "LatinX"],
    contanctName: "api_test",
    contactPhone: "api_test",
    organizationPurposeAndHistory: "api_test",
    technicalProblem: "api_test",
    solutionBenefits: "api_test",
    familiarWithSlack: true,
    keyStaffAvailability: [
      "They will be available remotely throughout the entire period by phone",
      "They will be available remotely throughout the entire period by phone",
    ],
  };

  const documentRef = collectionRef.doc(documentId);

  documentRef
    .update(updatedData)
    .then(() => {
      res.status(200).send("Application updated successfully");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error updating application");
    });
});

// Start the Express server
app.listen(3001, () => {
  console.log("Server listening on port 3001");
});
