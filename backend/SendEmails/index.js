const { AWS } = require('/opt/index');
const sesService = new AWS.SES();

exports.handler = async (event) => {

    const { emails, code } = JSON.parse(event.Records[0].body);

    const params = {
        Destination: {
            ToAddresses: emails,
        },
        Message: {
            Body: {
                Text: {
                    Data: `You have successfully paid for your ticket, your code is ${code}`,
                },
            },
            Subject: {
                Data: 'Ticket paid',
            },
        },
        Source: 'mohhafiz001@gmail.com',
    };

    try {
        await sesService.sendEmail(params).promise();

        return {
            statusCode: 200,
        };
    } catch (err) {
        console.error('Error sending email:', err);
        return {
            statusCode: 500,
        };
    }
};
