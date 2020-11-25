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

// Initialisierung SQLITE Datenbank
const DATABASE = "user.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(DATABASE);

// ═════════════════ Server starten ══════════════════
app.listen(80, function(){
    console.log("Server auf Port 80 gestartet");
});

app.use(express.static(__dirname + '/public'));

// ══════════════════ MainPage GET ═══════════════════
app.get("/", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
});
// ════════════════════ Login GET ════════════════════
app.get("/login", function(req, res){
    res.render("login");
});
// ══════════════════ Register GET ═══════════════════
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

// ═══════════════════ Login POST ════════════════════
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(username, password, rows) == true){
            res.send("Yee");
        }else{
            res.send("Ree");
        }   
    });
});

// Prüft ob Nutzername und Passwort stimmen
function anmeldungErfolgreich(benutzername, passwort, rows){
    for(var i = 0; i < rows.length; i++){
        if (rows[i].name == benutzername && rows[i].pw == passwort){
            return true;
        }
    }
    return false;
}


// ════════════════ Registrieren POST ═════════════════
app.post("/register", function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    const passrepeat = req.body.passwordRepeat;

    if (username.length >= 4){
        if (password.length >= 8){
            if (password == passrepeat){
                db.all('SELECT * FROM users', function(err, rows){
                    if (benutzerExistiert(username, rows) != true){
                        benutzerHinzufuegen(username, password);
                        res.send("YEEEEE");
                    }else{
                        res.send("Benutzer existiert bereits!");
                    }
                }
            );
            }else{
                res.send("Passwörter stimmen nicht überein!");
            }        
        }else{
            res.send("Passwort zu kurz! (min. 8 Zeichen)");
        }
    }else{
        res.send("Benutzername zu kurz! (min. 4 Zeichen)");
    }
});

// Prüft ob der Nutzer existiert
function benutzerExistiert(benutzername, rows){
    for(var i = 0; i < rows.length; i++){
        if (rows[i].username == benutzername){
            return true;
        }
    }
    return false;
};

// Fügt einen neuen Nutzer hinzu
function benutzerHinzufuegen(usr, pass){
    db.run(
        `INSERT INTO users(name, pw) VALUES("${usr}", "${pass}")`
    );
}