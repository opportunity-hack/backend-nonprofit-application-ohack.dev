// Import the Resend module
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);


// Define the WelcomeEmail class
class WelcomeEmail {
    // Define the constructor with the name and email parameters
    constructor(name, email) {
        // Set the state properties
        this.name = name;
        this.email = email;
        this.subject = 'Welcome to Opportunity Hack!';
        this.body = `✌️ ${name},
<br/>
We're so glad you joined Opportunity Hack, the community of hackers who use their skills to make a positive impact on the world.
<br/>
You're awesome for choosing to dedicate your time and talent to help nonprofits solve their challenges and achieve their missions.
<br/><br/>
We can't wait to see what you'll create and learn.
<br/><br/>
In the meantime, feel free to explore <a href="https://ohack.dev">ohack.dev</a> or <a href="https://opportunity-hack.slack.com/archives/C1Q6YHXQU">say hello in our Slack community</a>, and follow us on social media for the latest updates and opportunities.
<br/><br/>
Here are some helpful links to get you started:
<ul>
<li><a href="https://youtu.be/Ia_xsX-318E">An overview of OHack on YouTube</a></li>
<li><a href="https://ohack.dev/nonprofits">Projects</a></li>
<li><a href="https://www.ohack.org/about/faq">FAQ</a></li>
<li><a href="https://www.ohack.org/about">About</a></li>
<li><a href="https://www.ohack.org/about/sponsorship">Sponsorship</a></li>
</ul>
<br/>
If you have any questions or feedback, please don't hesitate to reach out to us at questions@ohack.org
<br/><br/>
Happy hacking!
<br/>
<b>The Opportunity Hack Team</b>
<br/>
<a href="https://www.ohack.dev">ohack.dev</a> | <a href="https://www.ohack.org">ohack.org</a> | @opportunityhack
<br/><br/><br/>
"We are part of this universe; we are in this universe, but perhaps more important than both of those facts, is that the universe is in us.” - Neil deGrasse Tyson
`;
    }
    
    sendEmail() {        
        resend.emails.send({
            from: 'OHack Hello <hello@apply.ohack.dev>',
            to: this.email,
            subject: this.subject,
            tags: [
                {
                    name: "category",
                    value: "welcome_email"
                }],
            html: `<div>
        <img src="https://i.imgur.com/Ih0mbYx.png" alt="Opportunity Hack Logo" width="250" height="100">
        <p>${this.body}</p>
      </div>`
        })
            .then(response => {
                console.log('Email sent successfully:', response);
            })
            .catch(error => {
                console.error('Email failed to send:', error);
            });
    }
}

// Export the class
module.exports = WelcomeEmail;