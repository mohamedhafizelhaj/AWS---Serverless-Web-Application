const { jwt, setUserPoolId, getKey, generatePolicy } = require('/opt/index')

exports.handler = (event, context, callback) => {
    
    setUserPoolId(process.env.COGNITO_USER_POOL_ID);

    const identitySource = event.identitySource[0]
    const token = identitySource.split(' ')[1]

    jwt.verify(token, getKey, (err, decoded) => {
        if (err) {
            console.log(`err: ${err}`);
            callback('Unauthorized');
        } else {
            const issuer = decoded.iss
            const expectedIssuer = `http://localhost.localstack.cloud:4566/${process.env.COGNITO_USER_POOL_ID}`

            if (issuer !== expectedIssuer)
                return callback(null, generatePolicy(decoded.sub, 'Deny', event.routeArn, 'global'))
            
            const role = decoded['custom:role'];
            
            if (role !== 'customer' && role !== 'organizer')                
                return callback(null, generatePolicy(decoded.sub, 'Deny', event.routeArn, 'global'))

            return callback(null, generatePolicy(decoded.sub, 'Allow', event.routeArn, 'global'))
        }
    });
};