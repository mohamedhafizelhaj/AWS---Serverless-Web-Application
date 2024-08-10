const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')

let client;

function setUserPoolId(id) {
    client = jwksRsa({
        jwksUri: `https://cognito-idp.localhost.localstack.cloud/${id}/.well-known/jwks_uri`
    })
}

function getKey(header, callback) {
    if (!client) {
        return callback(new Error('JWKS client not initialized'), null);
    }

    client.getSigningKey(header.kid, function(err, key) {
        if (err) {
            callback(err, null);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    })
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
        }
        authResponse.policyDocument = policyDocument;
    }
    authResponse.context = { role: role }
    return authResponse
};

module.exports = {
    jwt,
    setUserPoolId,
    getKey,
    generatePolicy
}