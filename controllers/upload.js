const fs = require('fs')
const path = require('path')
const GIFEncoder = require('gif-stream/encoder')
const GIFDecoder = require('gif-stream/decoder')
const gifParser = require('../lib/gify.js')
const PNG = require('pngjs').PNG
const jpeg = require('jpeg-js')
const settings = require('../settings.json')
const Stream = require('stream') // for turning Buffer to stream for the pipe API.
const Slide = require('../models/slide.js')
const errorHandlers = require('../errors/errorHandlers.js')

const crypto = require('crypto')

// ################
// Helper functions
// ################

const randomId = function () {
    return crypto.randomBytes(16).toString('hex')
}

const getFilepath = function (fileInfo, format){
    // if format === 'url' then return an url to the resource.
    // else return the filesystem path to the file.
    const base = format === 'url' ? path.join(settings.service_url,'uploads') : settings.uploads_path
    return path.join(base, fileInfo.id + fileInfo.extension)
}

const writeAndStore = function(fileInfo, stream, callback){
    stream.pipe(fs.createWriteStream(getFilepath(fileInfo)))
        .on('error', callback)
        .on('finish', function(){
            // once resource is created, call callback which will send client result.
            Slide.create({url: getFilepath(fileInfo, 'url')}).then(slide => {
                return callback(null, slide)
            }).catch(callback)
        })
}
const streamFromBuffer = function(buffer){
    stream = new Stream.Duplex()
    stream.push(buffer)
    stream.push(null)
    return stream
}

// ##################
// Upload controllers
// ##################

exports.gifUpload = function(req, res) {
    // Note: this allows files with arbitrary content after EOF, should make a new gif file after decoding it
    //       and write only that content.

    const gif = gifParser.getInfo(req.file.buffer)
    
    // ensure no malicous code is hidden in text or comments
    // if passed_previous_checks is false then it should cascade as false throughout.
    const reducer = (passed_previous_checks, image) => passed_previous_checks ? !image.text && !image.comments.length : false
    const no_comments_or_text = gif.images.reduce(reducer, true)

    if (gif.valid && gif.images && gif.height && gif.width && no_comments_or_text){
        const fileInfo = {id: randomId(), extension: '.gif'}
        // create new read and write stream in order to push buffer to it.
        const stream = streamFromBuffer(req.file.buffer)
            .pipe(new GIFDecoder({indexed: true}))  // decode gif
            .pipe(new GIFEncoder) // reencode gif to get rid of malicious code after EOF

        writeAndStore(fileInfo, stream, function(err, slide){
            if (err) {
                return errorHandlers.CreationError(req, res)(err)
            }
            res.status(201).json({ok:true, id: fileInfo.id, url: getFilepath(fileInfo, 'url'), slide})
        })
    }
    else return res.status(400).json({ok:false,message:"Invalid file format. If you believe this was a mistake, contact webmaster@f.kth.se. In the meantime you can host it on an image hosting site such as imgur and link to it instead."})
}

exports.pngUpload = function(req, res) {
    const fileInfo = {id: randomId(), extension: '.png'}    
    // create new read and write stream in order to push buffer to it.
    const stream = streamFromBuffer(req.file.buffer)
    // we can now use the pipe API.
    stream.pipe(new PNG())
        .on('error', function(err){
            res.status(400).json({ok:false,message:"Invalid file format. If you believe this was a mistake, contact webmaster@f.kth.se. In the meantime you can host it on an image hosting site such as imgur and link to it instead."})
        })
        .on('parsed', function(data){
            // Fill new PNG with the pixel data of the user PNG
            // in order to avoid hidden malicous code in PNG tEXt chunks or metadata.
            let cleanPng = new PNG({
                height:this.height,
                width:this.width,
                filterType: this.filterType || -1
            })
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var idx = (this.width * y + x) << 2;
                    cleanPng.data[idx  ] = data[idx  ];
                    cleanPng.data[idx+1] = data[idx+1];
                    cleanPng.data[idx+2] = data[idx+2];
                    cleanPng.data[idx+3] = data[idx+3];
                }
            }
            // Write to filesystem
            writeAndStore(fileInfo, stream, function(err, slide){
                if (err) {
                    return errorHandlers.CreationError(req, res)(err)
                }
                res.status(201).json({ok:true, id: fileInfo.id, url: getFilepath(fileInfo, 'url'), slide})
            })
        })
}

exports.jpgUpload = function(req, res) {
    let jpegData
    try {
        jpegData = jpeg.decode(req.file.buffer)
    }
    catch(err) {
        // jpeg-js doesn't have custom errors so we just catch every possibly error thrown.
        res.status(400).json({ok:false,message:"Invalid file format. If you believe this was a mistake, contact webmaster@f.kth.se. In the meantime you can host it on an image hosting site such as imgur and link to it instead."})
    }
    // quality: 1-100 is vaguely how closely approximated the reencoded data is 
    // to the original. 100 being best approximation.
    const quality = 100
    const newJpeg = jpeg.encode(jpegData, quality)

    const fileInfo = {id: randomId(), extension: '.jpg'}
    fs.writeFile(getFilepath(fileInfo), newJpeg.data, (err) => {
        if (err){
            console.log("ERROR:", err)
            return res.status(500).json({ok:false, message:"Internal server error, failed to write to filesystem."})
        }
        res.status(201).json({ok:true, id: fileInfo.id})
    })
}

