const express = require('express')
const request = require('request')
const querystring = require('querystring')
const settings = require('./settings.json')
const session = require('express-session');
const CASAuthentication = require('cas-authentication');
const fetch = require('node-fetch')
const Slide = require('./models/slide.js')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const checkAdminRights = require('./helpers').checkAdminRights
const instagram = require('./controllers/instagram.js')
const slide = require('./controllers/slide.js')

mongoose.Promise = Promise

let app = express()

// Set up an Express session, which is required for CASAuthentication.
app.use( session({
  secret            : 'super secret key',
  resave            : false,
  saveUninitialized : true
}));

app.use(express.static('public'))
app.use(bodyParser.json())

// Create a new instance of CASAuthentication.
var cas = new CASAuthentication({
  cas_url         : settings.cas_url, // The URL of the CAS server.	
  service_url     : settings.service_url, //The URL which is registered on the CAS server as a valid service.
  cas_version     : '3.0', // The CAS protocol version.	
  renew           : false, // Require the user to login to the CAS server regardless of whether a session exists.
  is_dev_mode     : settings.dev_mode, // Don't use CAS authentication and the session CAS variable is set to dev_mode_user.
  dev_mode_user   : settings.dev_mode_user, // The CAS user to use if dev mode is active.
  dev_mode_info   : settings.dev_mode_info, // The CAS user information to use if dev mode is active.
  session_name    : 'cas_user', // The name of the session variable storing the CAS user.	
  session_info    : 'cas_userinfo', // The name of the session variable storing the CAS user information. 
  destroy_session : false // Destroy the entire session upon logout or just delete the session variable storing the CAS user.
});

// ####################################################################
//            Main routes
// ####################################################################

/*CAS Authentication functions
Middleware:
-  cas.bounce: Unauthenticated clients will be redirected to the CAS login and then back to
              the route once authenticated.

-  cas.block:  Unauthenticated clients will receive a 401 Unauthorized response instead of data.

Endpoint functions:
-  cas.bounce_redirect: 
              Unauthenticated clients will be redirected to the CAS login and then to the
              provided "redirectTo" query parameter once authenticated (only used in login flow).
  
-  cas.logout: De-authenticate the client with the Express server and then            
              redirect the client to the CAS logout page.
*/
// ####################################################################

// Dashboard is supposed to be the main place where you manage the screen
app.get( '/dashboard', cas.bounce, function ( req, res ) { // TODO: USE TEMPLATING
    res.send( `<html>
                    <head>
                        <link rel="stylesheet" type="text/css" media="screen" href="style.css"/>
                    </head>
                    <body>
                        <div class="greeting">
                            <p>Welcome ` + req.session[cas.session_name] + `!</p>
                            <a href="/instagram/login" class="btn">Logga in med Instagram</a>
                        </div>
                    </body>
                </html>` );
});

// Landing portal.
app.get('/', (req, res) => res.sendFile('./public/index.html'))

app.get('/instagram', cas.block, instagram.getMedia)

// ####################################################################
//            API for the screen
// ####################################################################

// PUBLIC IN ORDER FOR RASPBERRY PI TO ACCESS IT.
app.get('/api/screen/slides', slide.getAllSlides);

app.get('/api/screen/slides/:id',         cas.block,                        slide.getById);
app.post('/api/screen/slides/create',     cas.block, checkAdminRights(cas), slide.create);
app.post('/api/screen/slides/remove/:id', cas.block, checkAdminRights(cas), slide.removeById);

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
//            Instagram OAuth
// ####################################################################

app.get('/instagram/login', cas.block, instagram.authorize)
app.get('/instagram/callback', instagram.callback)

// ####################################################################
//            Launch app to port 8888
// ####################################################################
const PORT = settings.PORT || 8888
mongoose.connect(settings.DB_URL)
const db = mongoose.connection

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    app.locals.db = db;
    app.listen(PORT, () => {console.log(`Listening on port ${PORT}.`)})
})