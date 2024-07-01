const AWS = require('aws-sdk');

const rdsDataService = new AWS.RDSDataService();
const secretsManager = new AWS.SecretsManager();

module.exports = {
    AWS,
    rdsDataService,
    secretsManager
}