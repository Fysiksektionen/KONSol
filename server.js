const express = require('express')
const request = require('request')
const querystring = require('querystring')
const settings = require('./settings.json')
const session = require('express-session');
const CASAuthentication = require('cas-authentication');

let app = express()

const redirect_uri = 
    settings.OAuth.REDIRECT_URI || 
    'http://localhost:8888/callback'

// Set up an Express session, which is required for CASAuthentication.
app.use( session({
  secret            : 'super secret key',
  resave            : false,
  saveUninitialized : true
}));

// Create a new instance of CASAuthentication.
var cas = new CASAuthentication({
  cas_url         : settings.cas_url, // The URL of the CAS server.	
  service_url     : settings.service_url, //The URL which is registered on the CAS server as a valid service.
  cas_version     : '3.0', // The CAS protocol version.	
  renew           : false, // Require the user to login to the CAS server regardless of whether a session exists.
  is_dev_mode     : settings.dev_mode, // Don't use CAS authentication and the session CAS variable is set to dev_mode_user.
  dev_mode_user   : '', // The CAS user to use if dev mode is active.
  dev_mode_info   : {}, // The CAS user information to use if dev mode is active.
  session_name    : 'cas_user', // The name of the session variable storing the CAS user.	
  session_info    : 'cas_userinfo', // The name of the session variable storing the CAS user information. 
  destroy_session : false // Destroy the entire session upon logout or just delete the session variable storing the CAS user.
});

// ####################################################################
//            Main routes
// ####################################################################

/*CAS Authentication middleware

  cas.bounce: Unauthenticated clients will be redirected to the CAS login and then back to
              the route once authenticated.

  cas.block:  Unauthenticated clients will receive a 401 Unauthorized response instead of data.

  cas.bounce_redirect: 
              Unauthenticated clients will be redirected to the CAS login and then to the
              provided "redirectTo" query parameter once authenticated (only used in login flow).
  
  cas.logout: De-authenticate the client with the Express server and then            
              redirect the client to the CAS logout page.
*/
// ####################################################################

// Dashboard is supposed to be the main place where you manage the screen
app.get( '/dashboard', cas.bounce, function ( req, res ) {
  res.send( '<html><body>Dashboard</body></html>' );
});

// Sample route for media content
app.get('/dashboard/media', cas.bounce, function(req, res) {res.send('<p>Media goes here</p>')})

// Landing portal.
app.get('/', function(req, res) {res.send('<h1>Hello, world!</h1><img src="https://i.imgur.com/79DBTgR.jpg" alt="Oops, contact webmaster@f.kth.se"/>')})


// ####################################################################
//            API for the screen
// ####################################################################

// Unauthenticated clients will receive a 401 Unauthorized response instead of
// the JSON data.
app.get( '/api', cas.block, function ( req, res ) {
  res.json( { success: true } );
});

// An example of accessing the CAS user session variable. This could be used to
// retrieve your own local user records based on authenticated CAS username.
app.get( '/api/user', cas.block, function ( req, res ) {
  res.json( { cas_user: req.session[ cas.session_name ] } );
});

// ####################################################################
//            CAS API
// ####################################################################

// Unauthenticated clients will be redirected to the CAS login and then to the
// provided "redirectTo" query parameter once authenticated.
app.get( '/authenticate', cas.bounce_redirect );

// This route will de-authenticate the client with the Express server and then
// redirect the client to the CAS logout page.
app.get( '/logout', cas.logout );

// ####################################################################
//            Instagram OAuth, code modified from https://github.com/mpj/oauth-bridge-template
// ####################################################################

/* Client prompted about app-permissions if not previously approved.
   Instagram redirects to the redirect_uri (/callback) provided when registering the app,
   but with a ?code= query parameter.
*/
app.get('/instagram/login', function(req, res) {
    res.redirect('https://api.instagram.com/oauth/authorize/?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            redirect_uri,
        })
    )
})

/* Upon receiving the redirect, extract the code from the query and
   proceed to ask instagram for an access token by providing the code received 
   and the necessary credentials. After receiving a response from instagram 
   we redirect the user to a desired frontend destination with the access_token
   as an extractable query parameter, which is then used as a key for the instagram API.
*/
app.get('/callback', function(req, res) {
    const code = req.query.code || null
    const authOptions = {
        url: 'https://api.instagram.com/oauth/access_token',
        form: {
            code: code,
            redirect_uri,
            grant_type: 'authorization_code',
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET
        },
        json: true
    }
    request.post(authOptions, function(error, response, body) {
        if(error){
            console.log(error)
        }
        const access_token = body.access_token
        const uri = settings.OAuth.FRONTEND_URI || "http://localhost:8888"
        res.redirect(uri + '?access_token=' + access_token)
    })
})

// ####################################################################
//            Launch app to port 8888
// ####################################################################
const PORT = settings.PORT || 8888
console.log(`Listening on port ${PORT}. `)
app.listen(PORT)