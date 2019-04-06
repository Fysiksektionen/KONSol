const fetch = require('node-fetch')
const querystring = require('querystring')
const request = require('request')
const settings = require('../settings.json')
const User = require('../models/user.js')
const Slide = require('../models/slide.js').Slide
const errorHandlers = require('../errors/errorHandlers.js')

const redirect_uri = 
    settings.OAuth.REDIRECT_URI || 
    'http://localhost:8888/callback'

// Helper function
const fetchMedia = access_token => 
    fetch("https://api.instagram.com/v1/users/self/media/recent/?access_token=" + access_token)
    .then(response => response.json())
    .then(json => json.data)
    .then(posts => posts
        // if (json.data) then map over posts, else propagate error
        ? posts.map(post => {
            return {
                url: post.images.standard_resolution.url,
                caption: post.caption && post.caption.text,
                created: post.created_time*1000 // *1000 for milliseconds and integer.
            }
        })
        : {error:"UnexpectedResponseError"}
    )


// Fetch and store new media. Caches access token.
exports.update = function(req, res) {
    User.findOne({username: req.session[settings.session_name]}).then(user => {
        if (user){
            const access_token = req.query.access_token || user.cached_ig_access_token || null
            if (access_token){
                fetchMedia(access_token)
                .then(media => {
                    if (media.error === "UnexpectedResponseError"){
                        // cached access token was probably invalid, login again to fetch a new one.
                        res.redirect(settings.service_url+'/instagram/login')
                    }
                    else {
                        // All went well, cache access token and create slides from data.
                        user.cacheToken(access_token)
                        Promise.all(Slide.createFromIG(media)) // returns a map of promises of slides, so we Promise.all
                        .then(slides => res.status(201).redirect(
                            process.env.KONSOL_NODE_ENV === 'production' ?  settings.service_url : 'http://localhost:3000'
                        ))
                        .catch(errorHandlers.CreationError(req, res))
                    }
                })
                .catch(err => {console.log("GOTCHA", err);res.sendStatus(500)})
            }
            else {
                res.redirect(settings.service_url+'/instagram/login')
            }
        }
        else {
            // login and redirect to this endpoint again to retry.
            res.redirect(settings.service_url+'/login?returnTo='+settings.service_url+'/instagram')
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
