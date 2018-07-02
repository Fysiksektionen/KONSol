const fs = require('fs')
const path = require('path')
const GIFEncoder = require('gif-stream/encoder')
const GIFDecoder = require('gif-stream/decoder')
const gifParser = require('../image_parsers/gif/gify.js')
const settings = require('../settings.json')
const stream = require('stream') // for turning Buffer to stream for the pipe API.

const crypto = require('crypto')
const randomId = function () {
    return crypto.randomBytes(16).toString('hex')
}

exports.gifUpload = function(req, res) {
    // Note: this allows files with arbitrary content after EOF, should make a new gif file after decoding it
    //       and write only that content.

    const gif = gifParser.getInfo(req.file.buffer)
    
    // ensure no malicous code is hidden in text or comments
    // if passed_previous_checks is false then it should cascade as false throughout.
    const reducer = (passed_previous_checks, image) => passed_previous_checks ? !image.text && !image.comments.length : false
    const no_comments_or_text = gif.images.reduce(reducer, true)

    if (gif.valid && gif.images && gif.height && gif.width && no_comments_or_text){
        // TODO: store file 
        const fileId = randomId()
        const filepath = path.join(settings.uploads_path, fileId + '.gif')

        // create new read and write stream in order to push buffer to it.
        streamFromBuffer = new stream.Duplex()
        streamFromBuffer.push(req.file.buffer)
        streamFromBuffer.push(null)
        // we can now use the pipe API.
        streamFromBuffer
            .pipe(new GIFDecoder({indexed: true}))  // decode gif
            .pipe(new GIFEncoder)                   // reencode gif to get rid of malicious code after EOF
            .pipe(fs.createWriteStream(filepath))   // write sanitised file to filepath
            .on('error', function(err){
                console.log("ERROR:" + err);
                return res.status(500).json({ok:false, message:"Internal server error, failed to write to filesystem."})
            })
            .on('finish', function(){
                // once resource is created send the id of it.
                return res.status(201).json({ok:true, id: fileId})
            })
    }
    else return res.status(400).json({ok:false,message:"Invalid file format. If you believe this was a mistake, contact webmaster@f.kth.se. In the meantime you can host it on an image hosting site such as imgur and link to it instead."})
}

exports.pngUpload = function(req, res) {}
exports.jpgUpload = function(req, res) {}

