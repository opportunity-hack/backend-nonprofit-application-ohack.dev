// Import slack web client
const { WebClient } = require('@slack/web-api');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = 'info';



require('dotenv').config();

// Create a new instance of the WebClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_BOT_TOKEN);



// Helper function to Send Slack messages
function sendSlackMessage(message, channel) {
    // Send a message to the channel passed in
    web.chat.postMessage({ channel: channel, text: message })
        .then((res) => {
            // `res` contains information about the posted message
            console.log('Message sent: ', res.ts);
        })
        .catch((error) => {
            logger.error(error);            
        }
        );
}

// Helper function to Send Slack messages
function sendSlackMessageWithAttachments(message, attachments, channel) {
    // Send a message to the channel passed in
    web.chat.postMessage({ channel: channel, text: message, attachments: attachments })
        .then((res) => {
            // `res` contains information about the posted message
            console.log('Message sent: ', res.ts);
        })
        .catch((error) => {
            logger.error(error);
        }
        );
}

// Export the sendSlackMessage function
module.exports = {
    sendSlackMessage,
    sendSlackMessageWithAttachments
};
