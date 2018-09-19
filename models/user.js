const mongoose = require('mongoose')
const Slide = require('./slide.js')

const Schema = mongoose.Schema

userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    cached_ig_access_token: String
})

userSchema.pre('save', function(next){
    this.username = this.username.toLowerCase()
    next()
})

userSchema.methods.cacheToken = function(access_token) {
    this.set({cached_ig_access_token : access_token})
    return this.save()
}

module.exports = mongoose.model('User', userSchema)