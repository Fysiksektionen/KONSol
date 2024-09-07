const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const settings = require('../settings.json')
const Screen = require('./screen.js')
const Schema = mongoose.Schema
const ValidationError =  mongoose.Error.ValidationError
const ValidatorError = mongoose.Error.ValidatorError

const slideSchema = new Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    caption: String,
    tags: {
        type: [String],
        default: [],
        validate: {
            validator: function(tags){return !tags.some(tag => !tag.length)}, // no empty '' tags
            message: props => `Error: tag:"${props.value}" is an empty string`
          },
    },
    start: Date,
    end: Date,
    visible: {
        type: Boolean,
        default: false
    },
    created: {
        type: Number,
        default: Date.now
    },
    fullscreen: {
        type: Boolean,
        default: false
    },
    remotely_hosted: {
        type: Boolean,
        default:true // specify as false if it's an uploaded image.
    },
    filename: {
        type: String,
        // if not remotely hosted, require filename.
        required: function(){ return !this.remotely_hosted} 
    }

    // user implementation
    // created_by: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // }
})

slideSchema.pre('save', function(next) {
    if (this.start && this.end){
        if (this.start > this.end) {
            let err = new ValidationError(this)
            err.errors.dates = new ValidatorError({
                message:"Start Date can't be after End Date",
                path:"start",
                name:"ValidatorError",
                type:'notvalid'
            })
            return next(err)
        }
    }
    next();
})

// remove stored image if it is locally hosted.
slideSchema.pre('remove', function(next){
    if(this.remotely_hosted) return next() // image not stored by this server.
    
    const filepath = path.join(settings.uploads_path, this.filename)
    fs.unlink(filepath, (err) => {
        if(err && err.code == 'ENOENT') {
            // File not found, so just continue deleting slide.
            next()
        }
        else if (err) next(err) // Other errors, i.e. insufficient permissions.
        else next() // removed file, now continue removing slide.
    })
})

slideSchema.statics.createFromIG = function (IGposts){
    return IGposts.map(post => this.findOne({url:post.url}).then(slide => {
        if(!slide) { // If not already created; avoids duplicate key error
            return this.create({tags:["instagram"], visible: true, ...post})
        }
        else {
            return Promise.resolve(slide)
        }
    }))
}

slideSchema.statics.saveSlide = function (requestBody, remotely_hosted, filename) {
    // unpack variables to avoid users setting `created` field.
    const {_id, url, fullscreen, visible, start, end, caption, tags} = requestBody
    if (_id) {
        // if id specified, try to find and update
        return this.findOne({_id}).then(slide=>{
            slide.set({url, fullscreen, visible, start, end, caption, tags})
            return slide.save() // this triggers the pre('save',...) call
        })
    }
    // No existing id, create new slide.
    return this.create({url, fullscreen, visible, start, end, caption, tags, remotely_hosted, filename})
}

const is_visible = function(slide, screen, now) {
    // for now there should only be one screen, otherwise change this to another query.
    // if not at least one tag of a slide is in the filter then it is not visible 
    if (screen.filter_tags.length && screen.filter_tags[0]){
        if (!slide.tags.some(tag => screen.filter_tags.includes(tag))) return false
    }
    if (slide.start && slide.end) return slide.visible || (slide.start <= now && now <= slide.end)
    else if (slide.start) return slide.visible || (slide.start <= now)
    else if (slide.end) return slide.visible && (now <= slide.end) // if now > end it should not show
    else return slide.visible    
}

slideSchema.statics.getVisible = function() {
    const now = new Date()
    // only return slides which are visible
    return Screen.findOne().then(screen => this.find().then(slides => slides.filter(slide => is_visible(slide, screen, now))))
}

module.exports.slideSchema = slideSchema
module.exports.Slide = mongoose.model('Slide', slideSchema)