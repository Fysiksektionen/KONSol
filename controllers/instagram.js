const fetch = require('node-fetch')
const querystring = require('querystring')
const request = require('request')
const settings = require('../settings.json')
const User = require('../models/user.js')
const Slide = require('../models/slide.js')
const errorHandlers = require('../errors/errorHandlers.js')

const redirect_uri = 
    settings.OAuth.REDIRECT_URI || 
    'http://localhost:8888/callback'

// Helper function
const fetchMedia = access_token => 
    fetch("https://api.instagram.com/v1/users/self/media/recent/?access_token=" + access_token)
    .then(response => response.json())
    .then(json => json.data)
    .then(posts => posts.map(post => {
        return {
            url: post.images.standard_resolution.url,
            caption: post.caption && post.caption.text,
            created: post.created_time*1000 // *1000 for milliseconds and integer.
        }
    }))


// Returns the stored slides if not explicitly told to update.
// If update query is specified, fetch and store new media. Caches access token.
exports.getMedia = function(req, res) {
    User.findOne({username: req.session[settings.session_name]}).then(user => {
        const access_token = req.query.access_token || user.cached_ig_access_token || null
        if (!req.query.access_token && !req.query.update){
            // just send all slides
            Slide.find().then(slides => res.status(200).json(slides))
        }
        else {
            console.log('updating')
            if (access_token){
                fetchMedia(access_token)
                .then(media => {
                    // All went well, cache access token and media.
                    user.cacheToken(access_token)
                    Promise.all(Slide.createFromIG(media)) // returns a map of promises of slides, so we Promise.all
                    .then(slides => res.status(201).json({ok:true, slides}))
                    .catch(errorHandlers.CreationError(req, res))
                })
                .catch(err => {console.log("GOTCHA", err);res.sendStatus(500)})
            }
            else {
                res.redirect('/instagram/login')
            }
        }
    })
}

// ####################################################################
// Instagram OAuth, code modified from https://github.com/mpj/oauth-bridge-template
// ####################################################################

/* Client prompted about app-permissions if not previously approved.
   Instagram redirects to the redirect_uri (/callback) provided when registering the app,
   but with a ?code= query parameter.
*/
exports.authorize = function(req, res) {
    res.redirect('https://api.instagram.com/oauth/authorize/?' +
        querystring.stringify({
            response_type: 'code',
            client_id: process.env.INSTAGRAM_CLIENT_ID,
            redirect_uri,
        })
    )
}

/* Upon receiving the redirect, extract the code from the query and
   proceed to ask instagram for an access token by providing the code received 
   and the necessary credentials. After receiving a response from instagram 
   we redirect the user to a desired frontend destination with the access_token
   as an extractable query parameter, which is then used as a key for the instagram API.
*/
exports.callback = function(req, res) {
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
}
