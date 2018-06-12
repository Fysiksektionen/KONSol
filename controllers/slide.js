const mongoose = require('mongoose')
const Slide = require('../models/slide')
const errorChecks = require('../errors/error-checks.js')

exports.getAllSlides = function(req, res) {
    // Return all slides
    Slide.find().then(result => res.json(result))
}

exports.create = function(req, res) {
    // Save new slide.
    if (!req.body) return res.sendStatus(400)
    Slide.create(req.body)
        .then(slide => {res.status(201);res.json({"ok":true, slide})})
        .catch(err => {
            if (err instanceof mongoose.Error.ValidationError){
                res.status(400)
                res.json({'message':'Validation failed',status:400,ok:false,errorName:'ValidationError',errors:err.errors})
            }
            else if (errorChecks.DuplicateError) {
                res.status(400)
                res.json({'message':err.message,status:400,ok:false,errorName:'DuplicateKeyError',errors:err.errors})
            }
            else {
                // Can we catch any other known errors here? Either way we should log it.
                // This is the downside to not using an error library.
                // log(err.message, err.errors)
                console.log(err)
                res.sendStatus(500)
            }
        })
}

exports.getById = function(req, res) {
    Slide.find({_id:req.params.id}).then(slide => res.json(slide))
}

// Currently a POST without a body. Could make the id a required part of the request body
// and simply make the route [...]/remove.
exports.removeById = function(req, res) {
    // Status is {"ok":1, "n":1} if all went well. Can return status.n = 0.
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        Slide.deleteOne({_id:req.params.id}).then(status => res.json(status))
    }
    else {
        res.status(400)
        res.json({'message':'InvalidId', status: 400, ok: false,errorName:'InvalidIdError'})
    }
}