const { rdsDataService } = require('/opt/index');
const https = require('https');
const { URL } = require('url');

exports.handler = async (event, context) => {
    const { RequestType, PhysicalResourceId } = event;

    let responseData = {};
    let physicalResourceId = PhysicalResourceId || context.logStreamName;

    if (RequestType === 'Delete' || RequestType === 'Update') {
        await sendResponse(event, context, 'SUCCESS', responseData, physicalResourceId);
        return;
    }

    const params = {
        resourceArn: process.env.AURORA_CLUSTER_ARN,
        secretArn: process.env.AURORA_SECRET_ARN,
        database: process.env.DATABASE,
        sql: 'INSERT INTO events (name, description, address, ticketprice, organizer_id) VALUES (:name, :description, :address, :ticketprice, :organizer_id)',
        parameterSets: [
            [
                { name: "name", value: { stringValue: 'Sample Event 1' } },
                { name: "description", value: { stringValue: 'Description 1' } },
                { name: "address", value: { stringValue: 'Address 1' } },
                { name: "ticketprice", value: { stringValue: '200' } },
                { name: "organizer_id", value: { stringValue: 'organizer1@mail.com' } }
            ],
            [
                { name: "name", value: { stringValue: 'Sample Event 2' } },
                { name: "description", value: { stringValue: 'Description 2' } },
                { name: "address", value: { stringValue: 'Address 2' } },
                { name: "ticketprice", value: { stringValue: '250' } },
                { name: "organizer_id", value: { stringValue: 'organizer2@mail.com' } }
            ],
            [
                { name: "name", value: { stringValue: 'Sample Event 3' } },
                { name: "description", value: { stringValue: 'Description 3' } },
                { name: "address", value: { stringValue: 'Address 3' } },
                { name: "ticketprice", value: { stringValue: '300' } },
                { name: "organizer_id", value: { stringValue: 'organizer3@mail.com' } }
            ]
        ]
    };

    try {
        await rdsDataService.batchExecuteStatement(params).promise();
        await sendResponse(event, context, 'SUCCESS', responseData, physicalResourceId);
    } catch (error) {
        await sendResponse(event, context, 'FAILED', { Error: error.message }, physicalResourceId);
    }
};

async function sendResponse(event, context, status, responseData, physicalResourceId) {
    const responseBody = JSON.stringify({
        Status: status,
        Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
        PhysicalResourceId: physicalResourceId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData,
    });

    const parsedUrl = new URL(event.ResponseURL);
    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
        method: 'PUT',
        headers: {
            'Content-Type': '',
            'Content-Length': Buffer.byteLength(responseBody),
        },
    };

    return new Promise((resolve, reject) => {
        const request = https.request(options, (response) => {
            resolve();
        });

        request.write(responseBody);
        request.end();
    });
};