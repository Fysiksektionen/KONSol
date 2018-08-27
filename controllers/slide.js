const mongoose = require('mongoose')
const Slide = require('../models/slide')
const errorHandlers = require('../errors/errorHandlers.js')

exports.getAllSlides = function(req, res) {
    // Return all slides
    Slide.find().then(result => res.json(result))
}

exports.save = function(req, res) {
    if (!req.body) return res.status(400).json({ok:false, message:"Missing request body"})
    if (req.body.url){
        Slide.save(req.body)
        .then(newSlide => {res.status(201); res.json({"ok":true, newSlide})})
        .catch(errorHandlers.CreationError(req,res))
    }
    else return res.status(400).redirect(req.headers['referer'])
}

exports.getById = function(req, res) {
    Slide.find({_id:req.params.id}).then(slide => res.json(slide))
}

// Currently a POST without a body. Could make the id a required part of the request body
// and simply make the route [...]/remove.
exports.removeById = function(req, res) {
    // Status is {"ok":1, "n":1} if all went as expected. 
    // Can return {"ok":1, "n":0}, meaning id was technically valid but no object had it.
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        Slide.deleteOne({_id:req.params.id}).then(status => res.json(status))
    }
    else {
        res.status(400)
        res.json({'message':'Invalid id', status: 400, ok: false, errorName: 'InvalidIdError'})
    }
}