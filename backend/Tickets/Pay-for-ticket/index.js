const { rdsDataService, AWS } = require('/opt/index');
const sqs = new AWS.SQS();

function generateTicketCode() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 15; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        result += chars[randomIndex];
    }
    return result;
}

exports.handler = async (event) => {
        
    const eventInfo = JSON.parse(event.body);

    const ticketInfo = {
        customer_id: eventInfo.username,
        event_id: eventInfo.event_name,
        code: generateTicketCode()
    }

    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'INSERT INTO tickets (customer_id, event_name, code) VALUES (:customerId, :eventName, :code)',
        parameters: [
            { name: 'customerId', value: { stringValue: ticketInfo.customer_id } },
            { name: 'eventName', value: { stringValue: ticketInfo.event_id }},
            { name: 'code', value: { stringValue: ticketInfo.code } }
        ]
    };

    try {
        const data = await rdsDataService.executeStatement(params).promise();

        const sqsParams = {
            MessageBody: JSON.stringify({
                emails: ["reciever@test.com"],
                code: ticketInfo.code
            }),
            QueueUrl: process.env.SQS_QUEUE_URL
        };

        await sqs.sendMessage(sqsParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control',
                'Access-Control-Allow-Methods': '*',
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};