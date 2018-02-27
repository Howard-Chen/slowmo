//video upload
var path = require('path');
var express = require("express");
var app = express();
var multer = require('multer');
var crypto = require("crypto");
var mime = require('mime-types');
var fs = require("fs");
var jsonfile = require('jsonfile')
var dataPath = 'data.json'

var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/videos')
    },
    filename: function(req, file, cb) {
        crypto.randomBytes(1, function(err, raw) {
            if (err) {
                console.log(err);
            }
            else {
                cb(null, getDateTime() + '-' + raw.toString('hex') + '.' + mime.extension(file.mimetype));
            }
        });


    }
})

var upload = multer({ storage: storage })

app.set("view engine", "ejs");

var dir = path.join(__dirname, 'public');

app.use(express.static(dir));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/page/:fn",function(req,res){
    res.render("page.ejs",{fnVar:req.params.fn});
  // console.log(req.params.name);

});

function createVideoThumbnail(req, res, next) {
    var filePath = req.file.path;
    var fileName = req.file.filename;

    ffmpeg(filePath)
        .on('filenames', function(filenames) {
            //console.log('Will generate ' + filenames.join(', '))
        })
        .on('end', function() {
            console.log('Screenshots taken');
            next();
        })
        .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
            res.send("Upload Failed: ffmpeg: "+ + err.message)
        })
        .screenshots({
            // Will take screens at 20%, 40%, 60% and 80% of the video 
            count: 1,
            folder: 'public/videos',
            filename: fileName.split(".")[0] + "-s.png",
            size: '640x360'
        });


}

function writeToData(req, res, next) {
    var fileName = req.file.filename;
    var new_obj = { "fn": fileName, "tb": fileName.split(".")[0] + "-s.png" }

    jsonfile.readFile(dataPath, function(err, obj) {
        if (err) throw err;
        else {
            obj.push(new_obj);
            jsonfile.writeFile(dataPath, obj, function(err) {
                if (err) { console.error(err) }
                else {
                    console.log("file uploaded!")
                    next();
                }
            })

        }

    })
}

app.post('/videoUpload', upload.single('video'), createVideoThumbnail, writeToData, function(req, res) {

    var file = req.file;
    //createThumbnail(file.path,file.filename, writeToData);
 
   // console.log('MIMEType：%s', file.mimetype);
    //console.log('Originalname：%s', file.originalname);
    //console.log('File.size：%s', file.size);
    //console.log('File.path：%s', file.path);
   // console.log('File.name：%s', file.filename);
    //res.render("qr",{linkVar:file.filename.split(".")[0]});
    res.redirect("/qr/"+file.filename.split(".")[0]);
    //res.send("Upload Successful");
    //res.end();

});

app.get("/qr/:link", function(req, res) {

            res.render("qr", { linkVar: req.params.link });

});



app.get("/gallery", function(req, res) {

    jsonfile.readFile(dataPath, function(err, obj) {
        if (err) throw err;
        else {
            obj.reverse();
            
            res.render("gallery", { obj: obj.slice(0,20) });
        }
    });


});

//  app.listen(process.env.PORT,process.env.IP,function(){
//      console.log("Server has Started");
//  });


const PORT = process.env.PORT || 3000;


app.listen(PORT, function() {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});


function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    // var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    //  return year  + month  + day  + hour  + min  + sec;

    return month + day + hour + min + sec;

}
