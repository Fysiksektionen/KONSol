const Screen = require('../models/screen.js')

exports.saveTags = function(req, res){
    // trim to avoid ["tag", ""], `tags` is string of tags separated by spaces
    const tags = req.body.tags.trim().split(" ").filter(tag => tag.length)
    // should only be one screen at the moment, so this is fine but ugly.
    Screen.findOne().then(screen=>{
        screen.set({filter_tags: tags})
        //new:true for returning the updated slide instead of old
        return screen.save({new:true}) 
    })
    .then(screen => res.send({ok:true, tags:screen.filter_tags}))
}

exports.getTags = function(req, res){
    Screen.findOne().then(screen => res.send({ok:true, tags:screen.filter_tags}))
}