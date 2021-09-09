(function() {
    const keys = require(process.env.SERVICE_ACCOUNT_AUTH_FILE_PATH);
    const { JWT, OAuth2Client } = require('google-auth-library');

    const accessibleScopes = [
        'https://www.googleapis.com/auth/admin.directory.group.member.readonly'
    ];

    async function callGoogleAPI(url) {
        const client = new JWT({
            email: keys.client_email,
            key: keys.private_key,
            subject: process.env.SERVICE_ACCOUNT_SUBJECT,
            scopes: accessibleScopes
        });

        return await client.request({ url }).catch(() => {});
    }

    const getGroupMembers = async function(groupKey, includeDerived = true) {
        return (
            await callGoogleAPI('https://admin.googleapis.com/admin/directory/v1/groups/' + groupKey + '/members?includeDerivedMembership=' + includeDerived.toString())
        )?.data?.members || [];
    };

    const userInGroup = async function(userId, groupKey) {
        const allMembers = await getGroupMembers(groupKey);
        return allMembers.some(
            (user) => user.id === userId
        );
    }

    const client = new OAuth2Client(process.env.CLIENT_ID);

    module.exports.verifyAndGetUserInfo = async function(token) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID
        });
        const payload = ticket.getPayload();
        return {
            id: payload.sub,
            name: payload.name,
            email: payload.email
        };
    }

    module.exports.checkPermissionToAccess = async function(userId) {
        return userInGroup(userId, process.env.AUTH_GROUP_KEY);
    }
}());
