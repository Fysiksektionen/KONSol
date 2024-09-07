const mongoose = require('mongoose')
const Schema = mongoose.Schema
// currently not needed, but could be used to display slides within screenSchema
// const slideSchema = require('./slide.js').slideSchema 

const screenSchema = new Schema({
    filter_tags: {
        type:[String],
        default:[]
    }
})

screenSchema.pre('save', function(next){
    // TODO validate filter_tags
    next()
})

module.exports = mongoose.model('Screen', screenSchema)