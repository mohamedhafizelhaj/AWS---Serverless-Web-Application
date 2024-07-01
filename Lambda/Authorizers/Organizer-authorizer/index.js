const { jwt, getKey, generatePolicy } = require('/opt/index')

exports.handler = (event, context, callback) => {
    const token = event.authorizationToken;

    jwt.verify(token, getKey, (err, decoded) => {
        if (err) {
            callback('Unauthorized');
        } else {
            const role = decoded['custom:role'];
            let policy;
            
            if (role === 'organizer') {
                policy = generatePolicy(decoded.sub, 'Allow', event.methodArn, 'customer');
            } else {
                policy = generatePolicy(decoded.sub, 'Deny', event.methodArn);
            }
            callback(null, policy);
        }
    });
};