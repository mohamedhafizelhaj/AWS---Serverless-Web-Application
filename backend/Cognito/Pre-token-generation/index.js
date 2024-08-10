const { AWS } = require('/opt/index')
const cognito = new AWS.CognitoIdentityServiceProvider()

exports.handler = async (event, context) => {
    const userPoolId = event.userPoolId;
    const userName = event.userName;

    const params = {
        Filter: `cognito:username = ${userName}`,
        UserPoolId: userPoolId
    };

    try {        
        const data = await cognito.listUsers(params).promise();

        const roleAttribute = data.Users[0].Attributes.find(attr => attr.Name === 'custom:role');
        const userRole = roleAttribute ? roleAttribute.Value : null;

        event.response.claimsAndScopeOverrideDetails = {
            "idTokenGeneration": {},
            "accessTokenGeneration": {
                "claimsToAddOrOverride": {
                    "custom:role": userRole
                },
            }
            };

        event.response.claimsOverrideDetails = {
            claimsToAddOrOverride: {
                'custom:role': userRole
            }
        }

    } catch (error) {
        console.error('Error fetching user attributes:', error);
        throw error;
    }

    context.done(null, event)
};