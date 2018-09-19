const mongoose = require('mongoose')
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
    tags: [String],
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
    }
    // user implementation
    // created_by: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // }
})

slideSchema.pre('validate', function(next) {
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

slideSchema.statics.save = function (requestBody) {
    // unpack variables to avoid users setting `created` field.
    const {_id, url, fullscreen, visible, start, end, caption} = requestBody
    if (_id) {
        // if id specified, try to find and update
        return this.findByIdAndUpdate(_id, {url, fullscreen, visible, start, end, caption}, {new:true})
    }
    // No existing id, create new slide.
    return this.create({url, fullscreen, visible, start, end, caption})
}

module.exports = mongoose.model('Slide', slideSchema)