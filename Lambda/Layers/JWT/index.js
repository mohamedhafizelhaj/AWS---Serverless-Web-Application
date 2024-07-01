const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    jwksUri: 'https://drive.usercontent.google.com/download?id=1uJ_FaE-szkV9envbVBX1e8faCnoXvQTl&export=download&authuser=0'
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, function(err, key) {
        if (err) {
            callback(err, null);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
}

const generatePolicy = (principalId, effect, resource, role) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        };
        authResponse.policyDocument = policyDocument;
    }
    authResponse.context = { role: role };
    return authResponse;
};

module.exports = {
    jwt,
    getKey,
    generatePolicy
}