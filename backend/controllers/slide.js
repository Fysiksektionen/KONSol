const mongoose = require('mongoose')
const Slide = require('../models/slide').Slide
const errorHandlers = require('../errors/errorHandlers.js')
const settings = require('../settings.json')

exports.getSlides = function(req, res) {
    if (req.query.visible && req.query.visible.toLowerCase() === 'true'){
        // fetch solely visible slides.
        Slide.getVisible().then(slides => res.status(200).json(slides))
        .catch(errorHandlers.InternalServerError(req,res)) // catch all
    }
    else {
        // Return all slides
        Slide.find().then(result => res.json(result))
        .catch(errorHandlers.InternalServerError(req,res)) // catch all   
    }
}

exports.save = function(req, res) {
    if (!req.body) return res.status(400).json({ok:false, message:"Missing request body"})
    if (req.body.url){
        Slide.saveSlide(req.body)
        .then(newSlide => {res.status(201); res.json({"ok":true, newSlide})})
        .catch(errorHandlers.CreationError(req,res))
    }
    else return res.status(400).json({ok:false,message:"Please specify an image URL or select an image to upload."})
}

exports.getById = function(req, res) {
    Slide.find({_id:req.params.id}).then(slide => res.json(slide))
    .catch(errorHandlers.InternalServerError(req,res)) // catch all
}

// Currently a POST without a body. Could make the id a required part of the request body
// and simply make the route [...]/remove.
exports.removeById = function(req, res) {
    // Status is {"ok":1, "n":1} if all went as expected. 
    // Can return {"ok":1, "n":0}, meaning id was technically valid but no object had it.
    const invalidIdResponse = {
        ok:0, n:0, message: `Couldn't find slide with id "${req.params.id}"`, errorName: "InvalidIdError"
    }

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        Slide.findById(req.params.id).then(slide => {
            if (!slide) return res.status(400).json(invalidIdResponse)
            slide.remove()
            .then(removedSlide => res.status(200).json({ok: 1, n: 1, removedSlide}))
            .catch(err => res.status(500).json({
                ok:false,
                message:settings.debug ? err.message : "Error removing file",
                errorName: "InternalServerError"
            }))
        })
    }
    else {
        res.status(400).json(invalidIdResponse)
    }
}