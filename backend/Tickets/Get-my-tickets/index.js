const { rdsDataService } = require('/opt/index');

exports.handler = async (event) => {

    const customerId = event.headers.Email

    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'SELECT * FROM tickets where customer_id = :customerId',
        parameters: [
            { name: 'customerId', value: { stringValue: customerId } }
        ]
    };

    try {
        const data = await rdsDataService.executeStatement(params).promise();
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