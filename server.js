// ####################################################################
//            Dependencies
// ####################################################################
require('dotenv').config();

const express = require('express')
const settings = require('./settings.json')
const session = require('express-session');
const auth = require('./lib/google-authentication.js');
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const MongoStore = require('connect-mongo')(session)
const cors = require('cors')
const csrf = require('csurf')

// #File uploading dependencies
const path = require('path')
const fileType = require('file-type')
const multer = require('multer')

// #Controllers
const instagram = require('./controllers/instagram.js')
const slide = require('./controllers/slide.js')
const upload = require('./controllers/upload.js')
const screen = require('./controllers/screen.js')
const errorHandlers = require('./errors/errorHandlers.js')

// #Helpers
const checkAdminRights = require('./helpers').checkAdminRights
const FileFilterError = require('./errors/customErrors.js').FileFilterError

// ####################################################################
//            Application setup
// ####################################################################

// #Multer setup
const fileFilter = function (req, file, cb) {
    // Not sure how much these checks matter since we're not storing the files by their original name anyways
    // but there's no such thing as too thorough when it comes to accepting files from users.
    const extension = path.extname(file.originalname)
    const only_one_dot = file.originalname.split('.').length === 2
    const valid_file_extension = ['.png', '.jpg', '.jpeg', '.gif'].includes(extension.toLowerCase())
    const valid_mimetype = ['image/png', 'image/jpeg', 'image/gif'].includes(file.mimetype)
    const valid = only_one_dot && valid_file_extension && valid_mimetype
    if (valid) {
        cb(null, valid)
    }
    else if (!only_one_dot)
        cb(new FileFilterError("Bad filename."))
    else if (!valid_file_extension)
        cb(new FileFilterError("Invalid file extension, must be png, jpg, jpeg or gif."))
    else if (!valid_mimetype)
        cb(new FileFilterError("Invalid mimetype, must be image/png, image/jpeg or image/gif."))
}

let storage = multer.memoryStorage()
const uploadSlideImage = multer({
    fileFilter,
    storage,
    limits: { fieldSize: 10 * 1024 * 1024, fileSize: 5 * 1024 * 1024 } // max 5 MB files
}).single('imageFile')

// #Mongoose setup
mongoose.Promise = Promise
mongoose.connect(settings.DB_URL)
const db = mongoose.connection

// #Express setup
let app = express()
app.use(bodyParser.json())

// Production use of the react build
if (process.env.KONSOL_NODE_ENV === 'production') {
    app.set('static_folder', 'client/build')
    app.use(express.static(app.get('static_folder')))
}
else {
    // cors for development mode
    var corsOptions = {
        origin: process.env.CLIENT_ORIGIN,
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
        credentials: true,
        optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
    }
    app.use(cors(corsOptions))
}

// Set up an Express session, which is required for CASAuthentication.
const halfDay = 1000 * 60 * 60 * 12;
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ url: settings.DB_URL, mongooseConnection: db }),
    cookie: { secure: process.env.KONSOL_NODE_ENV === "production", maxAge: halfDay },
}));


// app.use(csrf());
// app.use((req, res, next) => {
//     //TODO: should also set express trust proxy to 1 in production (since under apache proxy).
//     const cookie_options = process.env.KONSOL_NODE_ENV === 'production' ? { sameSite: true } : {}
//     res.cookie('XSRF-TOKEN', req.csrfToken(), cookie_options); 
//     next();
// });

// ####################################################################
//            Middleware
// ####################################################################

const requireLoggedIn = (req, res, next) => {
    if (req.session?.authenticated) {
        next();
    } else {
        res.status(403).json({ message: "Unautorized!" });
    }
}

// ####################################################################
//            Main routes
// ####################################################################

app.post('/api/screen/slides/save', requireLoggedIn, function (req, res) {
    uploadSlideImage(req, res, function (err) {
        if (err) {
            return errorHandlers.CreationError(req, res)(err)
        }
        else if (!req.file) {
            // create slide from url, not file.
            slide.save(req, res)
        }
        else {
            const filetype = fileType(req.file.buffer)
            switch (filetype.ext) {
                case 'png': return upload.pngUpload(req, res)
                case 'gif': return upload.gifUpload(req, res)
                case 'jpg': return upload.jpgUpload(req, res)
                default:
                    return res.status(400).json({
                        ok: false,
                        message: "Invalid file format, must be a png, gif or jpg file."
                    })
            }
        }
    })
})

app.get('/instagram', requireLoggedIn, instagram.update)

// ####################################################################
//            API for the screen
// ####################################################################

// Metadata about screen such as what slides to show.
app.post('/api/screen', requireLoggedIn, screen.saveTags)
// PUBLIC IN ORDER FOR RASPBERRY PI TO ACCESS IT.
app.get('/api/screen', screen.getTags)
app.get('/api/screen/slides', slide.getSlides);
app.get('/api/screen/slides/:id', requireLoggedIn, slide.getById);
app.post('/api/screen/slides/:id/remove', requireLoggedIn, slide.removeById);

// ####################################################################
//            API for the screen
// ####################################################################
app.post('/login', (req, res) => {
    auth.verifyAndGetUserInfo(req.body.token)
        .then(user => auth.checkPermissionToAccess(user.id) ? user : undefined)
        .then(user => {
            if (user) {
                req.session.authenticated = true;
                req.session.user = user;
                res.status(200).json({ loggedIn: true, user: req.session.user });
            } else {
                res.status(403).json({ loggedIn: false });
            }
        });
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ loggedIn: false });
})

app.get('/me', requireLoggedIn, (req, res) => {
    res.json({
        user: req.session.user
    });
});


// ####################################################################
//            Instagram OAuth
// ####################################################################

app.get('/instagram/login', requireLoggedIn, instagram.authorize)
app.get('/instagram/callback', instagram.callback)

// app.use((err, req, res, next) => {
//     if (err.code !== 'EBADCSRFTOKEN') return next(err);
//     res.status(403).json({
//         type: 'InvalidCSRFTokenError',
//         message: 'Invalid or missing CSRF token',
//         status: 403
//     });
// });

// ####################################################################
//            Launch app to port
// ####################################################################
const PORT = process.env.PORT

const Screen = require('./models/screen')
// for first time setup
Screen.findOne().then(screen => {
    // if no screen found
    if (!screen) {
        // then save first and only screen document
        let initScreen = new Screen({ filter_tags: "" })
        initScreen.save()
        console.log("Initialised screen")
    }
})

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    app.locals.db = db;
    app.listen(PORT, () => { console.log(`Listening on port ${PORT}.`) })
})