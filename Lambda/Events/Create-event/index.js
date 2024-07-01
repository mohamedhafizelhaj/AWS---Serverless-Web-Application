const { rdsDataService, secretsManager } = require('/opt/index');

exports.handler = async (event) => {

    const envName = "aurora-env";

    const response = await secretsManager.getSecretValue({ SecretId: envName }).promise();
    const env = JSON.parse(response.SecretString);
    
    const eventInfo = JSON.parse(event.body)

    const params = {
        resourceArn: env.RESOURCE_ARN,
        secretArn: env.SECRET_ARN,
        database: env.DATABASE_NAME,
        sql: 'INSERT INTO events (organizer_id, name, description, starttime, endtime, address, ticketprice, discount) VALUES (:organizer_id, :name, :description, :starttime, :endtime, :address, :ticketprice, :discount)',
        parameters: [
            { name: 'organizer_id', value: { stringValue: eventInfo.organizer_id } },
            { name: 'name', value: { stringValue: eventInfo.name } },
            { name: 'description', value: { stringValue: eventInfo.description } },
            { name: 'starttime', value: { stringValue: eventInfo.starttime } },
            { name: 'endtime', value: { stringValue: eventInfo.endtime } },
            { name: 'address', value: { stringValue: eventInfo.address } },
            { name: 'ticketprice', value: { stringValue: eventInfo.ticketprice } },
            { name: 'discount', value: { stringValue: eventInfo.discount } }
        ]
    };

    try {
        const data = await rdsDataService.executeStatement(params).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://c310b9f5.cloudfront.localhost.localstack.cloud',
                'Access-Control-Allow-Headers': 'Content-Type',
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