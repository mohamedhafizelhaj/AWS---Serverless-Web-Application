const { AWS } = require('/opt/index');
const sesService = new AWS.SES();

exports.handler = async (event) => {

    const { emails, type } = event.Records[0].body;

    const params = {
        Destination: {
            ToAddresses: emails,
        },
        Message: {
            Body: {
                Text: {
                    Data: type === 'ticket' ? 'You have successfully paid for your ticket' : 'Event updated, go to our platform and check what is new',
                },
            },
            Subject: {
                Data: type === 'ticket' ? 'Ticket paid' : 'Event updated',
            },
        },
        Source: 'mohhafiz001@gmail.com',
    };

    try {
        const data = await sesService.sendEmail(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully' }),
        };
    } catch (err) {
        console.error('Error sending email:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error sending email', error: err.message }),
        };
    }
};
