const { rdsDataService } = require('/opt/index')

exports.handler = async (event) => {

    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'SELECT * from events'
    };

    try {
        const data = await rdsDataService.executeStatement(params).promise();
        
        const records = data.records;
        const result = records.map(record => {
            return {
                organizer_id: record[1].stringValue,
                name: record[2].stringValue,
                address: record[3].stringValue,
                ticketprice: record[4].stringValue,
                description: record[5].stringValue
            };
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cache-Control',
                'Access-Control-Allow-Methods': '*',
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};