// Import the Resend module
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the WelcomeEmail class
class NonProfitApplicationSubmitConfirmation {
    // Define the constructor with the name and email parameters
    constructor(name, email) {
        // Set the state properties
        this.name = name;
        this.email = email;
        this.subject = 'Thank you for applying for Opportunity Hack!';
        this.body = `✌️ ${name},
<br/><br/>
We are delighted to receive your application for the Opportunity Hack October Hackathon!
<br/><br/>
We appreciate your interest and enthusiasm to join us as a partner and collaborate with our amazing community of hackers.
<br/><br/>
We are currently reviewing your application and we will get back to you soon with the next steps.
<br/><br/>
In the meantime, feel free to explore our <a href="https://ohack.dev">website</a>, <a href="https://slack.ohack.dev">join our Slack community</a>, and follow us on social media for the latest updates and opportunities.
<br/><br/>
If you have any questions or feedback, please don't hesitate to reach out to us at questions@ohack.org
<br/><br/>
Here are some helpful links:
<ul>
<li><a href="https://youtu.be/Ia_xsX-318E">An overview of OHack on YouTube</a></li>
<li><a href="https://ohack.dev/nonprofits/apply">Nonprofit Applications</a></li>
<li><a href="https://ohack.dev/nonprofits">Projects</a></li>
<li><a href="https://www.ohack.org/about/sponsorship">Sponsorship</a></li>
<li><a href="https://www.ohack.org/about/faq">FAQ</a></li>
<li><a href="https://www.ohack.org/about">About</a></li>
</ul>
<br/><br/>
Thank you for your time and dedication to making a positive impact on the world.
<br/>
The Opportunity Hack Team
<br/>
<a href="https://www.ohack.dev">ohack.dev</a> | <a href="https://www.ohack.org">ohack.org</a> | @opportunityhack
`;
    }

    sendEmail() {
        resend.emails.send({
            from: 'Opportunity Hack Application <hello@apply.ohack.dev>',            
            to: this.email,
            subject: this.subject,
            tags: [
                {
                    name: "category",
                    value: "nonprofit_apply_confirmation"
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
module.exports = NonProfitApplicationSubmitConfirmation;