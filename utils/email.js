const WelcomeEmail = require('../src/components/WelcomeEmail/WelcomeEmail.js');
const NonProfitApplyEmail1 = require('../src/components/NonProfitApplyEmail/NonProfitApplyEmail1.js');
const NonProfitApplyEmail2 = require('../src/components/NonProfitApplyEmail/NonProfitApplyEmail2.js');

const csv = require('csvtojson');
const RateLimiter = require('limiter').RateLimiter;
const limiter = new RateLimiter( { tokensPerInterval: 9, interval: 'second' } );


class SendMassEmailWelcome 
{
    constructor() {         
        this.directory = '/Users/gregv/Downloads/';       
    }    

    sendWithRateLimiting(name, email) {
        const remainingRequests = limiter.tryRemoveTokens(1);
        console.log('Remaining requests: ' + remainingRequests);
        if (!remainingRequests) {
            console.log('Rate limit exceeded');
            setTimeout(() => {
                this.sendWithRateLimiting(name, email);
            }, 2500);
        } else {                        
            const randomNumber = Math.floor(Math.random() * 2) + 1;
            console.log('Random number: ' + randomNumber);

            if (randomNumber === 1) {                                                
                new NonProfitApplyEmail1(name, email).sendEmail();                
            } else {                                
                new NonProfitApplyEmail2(name, email).sendEmail();                
            }
            // new WelcomeEmail(user.Name, user.Email).sendEmail();
        }
    }
         

    sendEmail() {
        // Read csv from ~/Downloads/slack_users.csv
        const csvFilePath = this.directory + 'slack_users_not_active.csv';
        csv()
            .fromFile(csvFilePath)
            .then((jsonObj) => {
                // console.log(jsonObj);
                jsonObj.forEach((user) => {
                    this.sendWithRateLimiting(user.Name, user.Email);
                });
            });
    }

    sendNonProfitApplicationEmail() 
    {
        // Read csv from ~/Downloads/slack_users.csv
        const csvFilePath = this.directory + 'nonprofit_applications_round_4.csv';
        csv()
            .fromFile(csvFilePath)
            .then((jsonObj) => 
            {                
                jsonObj.forEach((user) => 
                {                                                                                                    
                        var name = user.Name;
                        var email = user.Email;

                        // Upper case first letter of first name and last name 
                        if(name === undefined || name === null || name === '' || name.split(' ').length < 2) {
                            console.log('Invalid name: ' + name);
                            return;
                        }
                        var firstName = '';
                        var lastName = '';
                        // Lowercase name 
                        name = name.toLowerCase();
                        email = email.toLowerCase();
                        // Remove any mailto: from email
                        email = email.replace('mailto:', '');

                        // Create email list if they have more than 1 email
                        var emailList = [];
                        if(email.split(',').length > 1) {
                            emailList = email.split(',');
                        }
                        // Handle if they have more than 1 email
                        else if (email.split(' ').length > 1) {
                            emailList = email.split(' ');
                        } else {
                            emailList.push(email);
                        }

                        // Remove empty emails
                        emailList = emailList.filter(function (el) {
                            return el != null && el != '';
                        });                        
                        
                        // Remove an email without an @ symbol
                        emailList = emailList.filter(function (el) {
                            return el.includes('@');
                        });
                    

                        // If the name has more than 2 words, then get only the first and last
                        if( name.split(' ').length > 2 )
                        {
                            // Get the first and last name
                            firstName = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1);
                            lastName = name.split(' ')[name.split(' ').length - 1].charAt(0).toUpperCase() + name.split(' ')[name.split(' ').length - 1].slice(1);
                        }
                        else {
                            firstName = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1);                            
                            lastName = name.split(' ')[1].charAt(0).toUpperCase() + name.split(' ')[1].slice(1);
                        }
                        
                        const fullName = firstName + ' ' + lastName;
                        console.log(fullName);
                        console.log(emailList);

                        // Send email to each email in the list
                        emailList.forEach( (aemail) => {
                            console.log('Sending email to ' + fullName + ' at ' + aemail);
                            this.sendWithRateLimiting(fullName, aemail);
                            
                        });
                    });                    
                });                                        
    }    

}

new SendMassEmailWelcome().sendNonProfitApplicationEmail();