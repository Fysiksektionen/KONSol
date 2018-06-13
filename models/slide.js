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
            return this.create(post)
        }
        else {
            return Promise.resolve(slide)
        }
    }))
}

slideSchema.methods.toggleVisibility = function() {
    this.set({visible : !this.visible})
    return this.save()
}

module.exports = mongoose.model('Slide', slideSchema)