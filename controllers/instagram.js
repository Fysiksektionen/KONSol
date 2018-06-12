const fetch = require('node-fetch')
const querystring = require('querystring')
const request = require('request')
const settings = require('../settings.json')
// const User = require('../models/user')

const redirect_uri = 
    settings.OAuth.REDIRECT_URI || 
    'http://localhost:8888/callback'

exports.getMedia = function(req, res) {
    access_token = req.query.access_token || null
    if (access_token){ // todo: check req.originalUrl, check if recently updated and cached.
        fetch("https://api.instagram.com/v1/users/self/media/recent/?access_token=" + access_token)
            .then(response => {
                if (response.status === 200){
                    // User.cacheToken(access_token)
                }
                return response
            })
            .then(response => response.json())
            .then(json => json.data)
            .then(posts => posts.map(post => {
                return {
                    img: post.images.standard_resolution,
                    caption: post.caption && post.caption.text
                }
            }))
            .then(media => {
                // Just a temporary example rendering of the images
                result = ''
                for (let i=0; i<media.length;i++){
                    result+='<img src="'+media[i].img.url+'" alt="Oops, unable to find this image"/>'
                }
                res.send(result)
                // res.render('media', media)
                return media
            })
            // .then(media => User.cacheInstagram(app.locals.db, media))
            .catch(err => {console.log(err);res.sendStatus(500)}
        )
    }
    else {
        res.redirect('/instagram/login')
    }
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
