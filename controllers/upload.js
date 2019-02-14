const fs = require('fs')
const path = require('path')
const GIFEncoder = require('gif-stream/encoder')
const GIFDecoder = require('gif-stream/decoder')
const gifParser = require('../lib/gify.js')
const PNG = require('pngjs').PNG
const jpeg = require('jpeg-js')
const settings = require('../settings.json')
const Stream = require('stream') // for turning Buffer to stream for the pipe API.
const Slide = require('../models/slide.js').Slide
const errorHandlers = require('../errors/errorHandlers.js')

const crypto = require('crypto')

// ################
// Helper functions
// ################

const randomId = function () {
    return crypto.randomBytes(16).toString('hex')
}

const getFilepath = function (fileName, format){
    // if format === 'url' then return an url to the resource.
    // else return the filesystem path to the file.
    const base = format === 'url' ? '/img/' : settings.uploads_path
    return path.join(base, fileName)
}

const writeAndStore = function(fileName, body, stream, callback){
    stream.pipe(fs.createWriteStream(getFilepath(fileName)))
        .on('error', callback)
        .on('finish', function(){
            body.url = getFilepath(fileName, 'url')
            // Set remotely hosted to false here, indicates the slide has an image stored locally.
            const remotely_hosted = false
            Slide.save(body, remotely_hosted, fileName).then(slide => {
                // once resource is created, call callback which will send client result.
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

const finalCallback = (req,res) => function(err, newSlide){
    if (err) {
        return errorHandlers.CreationError(req, res)(err)
    }
    res.status(201).json({ok:true, newSlide})
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
        const fileName = randomId() + '.gif'
        // create new read and write stream in order to push buffer to it.
        const stream = streamFromBuffer(req.file.buffer)
            .pipe(new GIFDecoder({indexed: true}))  // decode gif
            .pipe(new GIFEncoder) // reencode gif to get rid of malicious code after EOF

        writeAndStore(fileName, req.body, stream, finalCallback(req,res))
    }
    else return res.status(400).json({ok:false,message:"Invalid file format. If you believe this was a mistake, contact webmaster@f.kth.se. In the meantime you can host it on an image hosting site such as imgur and link to it instead."})
}

exports.pngUpload = function(req, res) {
    const fileName = randomId() + '.png'    
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
            cleanPng.pack()
            // Write to filesystem
            writeAndStore(fileName, req.body, cleanPng, finalCallback(req,res))
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
    const stream = streamFromBuffer(newJpeg.data)
    const fileName = randomId() + '.jpg'
    
    writeAndStore(fileName, req.body, stream, finalCallback(req,res))
}

