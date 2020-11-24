// ════════════════ Initialisierung ══════════════════
// Initialisierung Express.js
const express = require("express");
const app = express();

// Initialisierung Body-Parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// Initialisierung EJS
app.engine(".ejs", require("ejs").__express);
app.set("view engine", "ejs");

// Initialisierung FileUpload
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// Initialisierung MD5 Hash Generator
var md5 = require('md5');


// ═════════════════ Server starten ══════════════════
app.listen(80, function(){
    console.log("Server auf Port 80 gestartet");
});

app.use(express.static(__dirname + '/public'));

// ══════════════════════ GET ══════════════════════
app.get("/", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

// ═════════════════════ POST ══════════════════════
app.post("/onupload", function(req, res){
    const file = req.files.filename;

    // Berechnet den MD5 Hash von der Datei
    const tempmd5 = md5(file);

    // Speichert die Datei unter "upload" und benutzt den md5 hash
    file.mv(__dirname + "/upload/" + tempmd5 + "_" + file.name);

});
