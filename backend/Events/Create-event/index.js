const { rdsDataService } = require('/opt/index')

exports.handler = async (event) => {

    const eventInfo = JSON.parse(event.body)
    
    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'INSERT INTO events (name, description, address, ticketprice, organizer_id) VALUES (:name, :description, :address, :ticketprice, :organizer_id)',
        parameters: [
            { name: 'name', value: { stringValue: eventInfo.name } },
            { name: 'description', value: { stringValue: eventInfo.description } },
            { name: 'address', value: { stringValue: eventInfo.address } },
            { name: 'ticketprice', value: { stringValue: eventInfo.ticketprice } },
            { name: 'organizer_id', value: { stringValue: eventInfo.organizer_id } }
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