const AWS = require('aws-sdk');

const rdsDataService = new AWS.RDSDataService();
module.exports = { AWS, rdsDataService }