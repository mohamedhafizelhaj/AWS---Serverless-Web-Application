const { rdsDataService, secretsManager, AWS } = require('/opt/index');
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
    const envName = "aurora-env";

    const response = await secretsManager.getSecretValue({ SecretId: envName }).promise();
    const env = JSON.parse(response.SecretString);
        
    const { id } = event.pathParameters;
    const eventInfo = JSON.parse(event.body);

    const ticketInfo = {
        customer_id: eventInfo.username,
        event_id: id,
        code: generateTicketCode()
    }

    const params = {
        resourceArn: env.RESOURCE_ARN,
        secretArn: env.SECRET_ARN,
        database: env.DATABASE_NAME,
        sql: 'INSERT INTO tickets (customer_id, event_id, code) VALUES (:customerId, :eventId, :code)',
        parameters: [
            { name: 'customerId', value: { stringValue: ticketInfo.customer_id } },
            { name: 'eventId', value: { longValue: parseInt(ticketInfo.event_id) }},
            { name: 'code', value: { stringValue: ticketInfo.code } }
        ]
    };

    try {
        const data = await rdsDataService.executeStatement(params).promise();

        const sqsParams = {
            MessageBody: JSON.stringify({
                emails: ["me@test.com"],
                type: "ticket"
            }),
            QueueUrl: 'http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/SendEmails'
        };

        await sqs.sendMessage(sqsParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://c310b9f5.cloudfront.localhost.localstack.cloud',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': '*',
            },
            //body: JSON.stringify(data)
            body: 'hello'
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};