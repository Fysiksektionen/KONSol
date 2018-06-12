const mongoose = require('mongoose')
const Schema = mongoose.Schema

const slideSchema = new Schema({
    name:String,
    url: {
        type:String,
        required:true
    },
    caption:String,
    tags:[String],
    start: {
        type: Date,
        required: true
    },
    end: Date,
    created: {
        type: Date,
        default: Date.now
    }
    // user implementation
    // created_by: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // }
})

// slideSchema.pre('save', function(next) {
//     // Names are case-insensitive, so store them
//     // in lowercase:
//     this.name = this.name.toLowerCase();
//     next();
// });

module.exports = mongoose.model('Slide', slideSchema)