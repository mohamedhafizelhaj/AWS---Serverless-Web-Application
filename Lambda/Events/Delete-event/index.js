const { rdsDataService, secretsManager } = require('/opt/index');

exports.handler = async (event) => {
    const envName = "aurora-env";

    const response = await secretsManager.getSecretValue({ SecretId: envName }).promise();
    const env = JSON.parse(response.SecretString);

    const { id } = event.pathParameters;

    const params = {
        resourceArn: env.RESOURCE_ARN,
        secretArn: env.SECRET_ARN,
        database: env.DATABASE_NAME,
        sql: 'DELETE FROM events WHERE id = :eventId',
        parameters: [
            { name: "eventId", value: { longValue: parseInt(id) } }
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