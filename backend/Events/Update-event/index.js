const { rdsDataService } = require('/opt/index')

exports.handler = async (event) => {

    const eventInfo = JSON.parse(event.body)

    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'UPDATE events SET name = :new_name, description = :description WHERE name = :old_name',
        parameters: [
            { name: 'old_name', value: { stringValue: eventInfo.old_name } },
            { name: 'new_name', value: { stringValue: eventInfo.new_name } },
            { name: 'description', value: { stringValue: eventInfo.description } },
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