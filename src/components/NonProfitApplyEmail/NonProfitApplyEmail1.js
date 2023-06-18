// Import the Resend module
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Define the WelcomeEmail class
class NonProfitApplyEmail1 {
    // Define the constructor with the name and email parameters
    constructor(name, email) {
        // Set the state properties
        this.name = name;
        this.email = email;
        this.subject = 'Apply now for the Opportunity Hack October Hackathon!';
        this.body = `✌️ ${name},
<br/>
Do you have a challenge or an idea that could benefit from the skills and creativity of talented hackers?
<br/><br/>
If so, we have an amazing opportunity for you!
<br/><br/>
Opportunity Hack is a community of hackers who use their skills to make a positive impact on the world. We are hosting our October Hackathon on October 7-8th, and we are looking for nonprofits like you to join us as partners.
<br/><br/>
As a partner, you will get to pitch your challenge or idea to a team of hackers who will work with you to create a solution in 24 hours. You will also get access to mentors, workshops, and resources to help you along the way.
<br/><br/>
The best part is that it's completely free and virtual for those not attending in Arizona, so you can participate from anywhere in the world.
<br/><br/>
But hurry, the <b>deadline to apply is June 30, 2023.</b>
<br/><br/>
Don't miss this chance to collaborate with passionate hackers and find innovative solutions for your nonprofit.
<br/><br/>
To apply, please visit <a href="https://apply.ohack.dev">apply.ohack.dev</a> and fill out the application form.
<br/><br/>
If you have any questions or need more information, please reply to this email or contact us at questions@ohack.org.
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
We hope to see you at the hackathon!
<br/><br/>
The Opportunity Hack Team
<br/>
<a href="https://www.ohack.dev">ohack.dev</a> | <a href="https://www.ohack.org">ohack.org</a> | @opportunityhack
`;
    }

    sendEmail() {
        // Define an array of possible from email names
        const fromNames = [
            'Opportunity Hack Support',
            'Your Opportunity Hack Partner',
            'Opportunity Hack Community Managers',
            'Opportunity Hack Mentor',
            'Opportunity Hack Team'
        ];

        // Define a function to get a random element from an array
        const getRandomElement = (array) => {
            // Get a random index from 0 to array length - 1
            const randomIndex = Math.floor(Math.random() * array.length);
            // Return the element at that index
            return array[randomIndex];
        };

        const fromName = getRandomElement(fromNames);
        const fromNameWithUnderScores = fromName.replace(/\s/g, '_').toLowerCase();
        resend.emails.send({
            from: `${fromName} <hello@apply.ohack.dev>`,
            to: this.email,
            subject: this.subject,
            tags: [
                {
                    name: "category",
                    value: "nonprofit_apply_1"
                },
                {
                    name: 'from_name',
                    value: fromNameWithUnderScores
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
module.exports = NonProfitApplyEmail1;

