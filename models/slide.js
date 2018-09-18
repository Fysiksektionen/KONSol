const mongoose = require('mongoose')
const Schema = mongoose.Schema

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