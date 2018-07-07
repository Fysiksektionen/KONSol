const mongoose = require('mongoose')
const errorChecks = require('./error-checks.js')
const settings = require('../settings.json')

exports.CreationError = (req, res) => err => {
    if (err instanceof mongoose.Error.ValidationError){
        res.status(400)
        res.json({'message':'Validation failed',status:400,ok:false,errorName:'ValidationError',errors:err.errors})
    }
    else if (errorChecks.DuplicateError(err)) {
        res.status(400)
        res.json({'message':err.message,status:400,ok:false,errorName:'DuplicateKeyError',errors:err.errors})
    }
    else {
        // TODO better logging.
        // Can we catch any other known errors here? Either way we should log it with a real logger.
        // This is the downside to not using an error library.
        // log(err.message, err.errors)
        console.log(err)
        res.status(500).json({
            ok:false, 
            message:settings.debug ? err.message : "Internal server error",
            errors: settings.debug ? err.errors  : undefined
        })
    }
}