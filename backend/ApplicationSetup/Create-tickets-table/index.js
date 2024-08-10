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
        sql: `
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id VARCHAR(255) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                code VARCHAR(255) NOT NULL
            )
        `
    };

    try {
        await rdsDataService.executeStatement(params).promise();
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