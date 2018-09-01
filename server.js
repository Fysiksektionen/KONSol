// ####################################################################
//            Dependencies
// ####################################################################
const express =           require('express')
const settings =          require('./settings.json')
const session =           require('express-session');
const CASAuthentication = require('./lib/cas-authentication.js');
const mongoose =          require('mongoose')
const bodyParser =        require('body-parser')
const cors = require('cors')

// #File uploading dependencies
const path =     require('path')
const fileType = require('file-type')
const multer =   require('multer')

// #Controllers
const instagram = require('./controllers/instagram.js')
const slide =     require('./controllers/slide.js')
const upload =    require('./controllers/upload.js')

// #Helpers
const checkAdminRights = require('./helpers').checkAdminRights
const validCharacters =  require('./helpers').validCharacters

// ####################################################################
//            Application setup
// ####################################################################

// #Multer setup
const fileFilter = function (req, file, cb){
    // Not sure how much these checks matter since we're not storing the files by their original name anyways
    // but there's no such thing as too thorough when it comes to accepting files from users.
    const extension = path.extname(file.originalname)
    const only_one_dot = file.originalname.split('.').length === 2
    const valid_file_extension = ['.png','.jpg','.jpeg','.gif'].includes(extension)
    const valid_mimetype = ['image/png','image/jpeg','image/gif'].includes(file.mimetype)
    const alphanumeric_name = validCharacters(file.originalname)
    const valid = only_one_dot && valid_file_extension && valid_mimetype && alphanumeric_name
    if (valid){
        cb(null, valid)
    }
    else if (!only_one_dot || !alphanumeric_name)
        cb(new Error("Invalid filename, only alphanumeric filenames with a file extension are allowed."))
    else if (!valid_file_extension)
        cb(new Error("Invalid file extension, must be png, jpg, jpeg or gif."))
    else if (!valid_mimetype)
        cb(new Error("Invalid mimetype, must be image/png, image/jpeg or image/gif"))
}

let storage = multer.memoryStorage()
const uploadSlideImage = multer({fileFilter, storage}).single('imageFile')

// #Mongoose setup
mongoose.Promise = Promise

// #Express setup
let app = express()

// Production use of the react build
if (process.env.KONSOL_NODE_ENV === 'production') {
    app.set('static_folder', 'client/build')
    app.use(express.static(app.get('static_folder')))
}
else {
    // cors for development mode
    var corsOptions = {
        origin: 'http://localhost:3000',
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }
    app.use(cors(corsOptions))
}

  // Set up an Express session, which is required for CASAuthentication.
app.use( session({
  secret            : 'super secret key',
  resave            : false,
  saveUninitialized : true
}));

app.use(bodyParser.json())

// Create a new instance of CASAuthentication.
let cas = new CASAuthentication({
  cas_url         : settings.cas_url, // The URL of the CAS server.	
  service_url     : settings.service_url, //The URL which is registered on the CAS server as a valid service.
  cas_version     : '3.0', // The CAS protocol version.	
  renew           : false, // Require the user to login to the CAS server regardless of whether a session exists.
  is_dev_mode     : settings.dev_mode, // Don't use CAS authentication and the session CAS variable is set to dev_mode_user.
  dev_mode_user   : settings.dev_mode_user, // The CAS user to use if dev mode is active.
  dev_mode_info   : settings.dev_mode_info, // The CAS user information to use if dev mode is active.
  session_name    : settings.session_name, // The name of the session variable storing the CAS user.	
  session_info    : settings.session_info, // The name of the session variable storing the CAS user information. 
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

app.post('/api/screen/slides/save', cas.block, checkAdminRights, function(req,res){
    uploadSlideImage(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            console.log(err)
            return res.status(400).json({ok:false, 
                message: settings.debug ? err.message : "An error occurred when uploading"})
        }
        else if (!req.file){
            // create slide from url, not file.
            slide.save(req, res)
        } 
        else {
            const filetype = fileType(req.file.buffer)
            switch (filetype.ext){
                case 'png': return upload.pngUpload(req, res)
                case 'gif': return upload.gifUpload(req, res)
                case 'jpg': return upload.jpgUpload(req, res)
                default:
                    return res.status(400).json({ok:false,
                        message:"Invalid file format, must be a png, gif or jpg file."})
            }
        }
    })
})

app.get('/instagram', cas.block, instagram.getMedia)
app.get('/login', cas.bounce_redirect)
// ####################################################################
//            API for the screen
// ####################################################################

// Get basic user info
app.get('/api/me', cas.block, function(req, res){
    res.status(200).json({
        ok:true,
        name:req.session[settings.session_name],
        info:req.session[settings.session_info]
    })
})

// PUBLIC IN ORDER FOR RASPBERRY PI TO ACCESS IT.
app.get('/api/screen/slides', slide.getAllSlides);
app.get('/api/screen/slides/:id',         cas.block,                   slide.getById);
app.post('/api/screen/slides/:id/remove', cas.block, checkAdminRights, slide.removeById);

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