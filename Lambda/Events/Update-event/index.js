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
        sql: 'UPDATE events SET name = :name, description = :description, starttime = :starttime, endtime = :endtime WHERE id = :eventId',
        parameters: [
            { name: 'name', value: { stringValue: eventInfo.name } },
            { name: 'description', value: { stringValue: eventInfo.description } },
            { name: 'starttime', value: { stringValue: eventInfo.starttime } },
            { name: 'endtime', value: { stringValue: eventInfo.endtime } },
            { name: "eventId", value: { longValue: parseInt(eventInfo.id) } }
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