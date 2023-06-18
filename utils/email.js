const WelcomeEmail = require('../src/components/WelcomeEmail/WelcomeEmail.js');
const csv = require('csvtojson');


class SendMassEmailWelcome {
    constructor() {                
    }

    sendEmail() {
        // Read csv from ~/Downloads/slack_users.csv
        const csvFilePath = '/Users/<username>/Downloads/slack_users_not_active.csv';
        csv()
            .fromFile(csvFilePath)
            .then((jsonObj) => {
                // console.log(jsonObj);
                jsonObj.forEach((user) => {                    
                    // Sleep for 1 second as a rate limiter for Resend API                
                    setTimeout(() => {
                        console.log(user.Name);
                        console.log(user.Email);
                        // new WelcomeEmail(user.Name, user.Email).sendEmail();
                    }
                    , 2000);


                });
            });
    }
}

new SendMassEmailWelcome().sendEmail();