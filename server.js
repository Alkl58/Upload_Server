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

// Initialisierung Cookie Parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// ═════════════════ Server starten ══════════════════
app.listen(80, function(){
    console.log("Server auf Port 80 gestartet");
});

app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname + '/upload'));

// ══════════════════ MainPage GET ═══════════════════
app.get("/", function(req, res){
    res.sendFile(__dirname + "/views/index.html");
});
// ════════════════════ Login GET ════════════════════
app.get("/login", function(req, res){
    res.render("login", {"errorText": null});
});
// ══════════════════ Register GET ═══════════════════
app.get("/register", function(req, res){
    res.render("register", {"errorText": null});
});

app.get("/uploads", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true){
            // Berechnet den MD5 Hash von der Datei
            const usrmd5 = md5(usr);

            var fs = require('fs');
            // Erstellt den Unterordner wenn es nicht existiert
            if (!fs.existsSync(__dirname + "/upload/" + usrmd5)){
                fs.mkdirSync(__dirname + "/upload/" + usrmd5);
            }

            // Ließt alle Hochgeladenen Dateien
            var dateiarray = []
            fs.readdir(__dirname + "/upload/" + usrmd5 + "/", (err, files) => {
                files.forEach(file => {
                    // Fügt alle Elemente in Ordner zu Array zu
                    dateiarray.push(usrmd5 + "/" + file);
                });
                res.render("uploads", {"uploads": dateiarray});
            });
        }else{
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login", {"errorText": "Bitte einloggen!"});
        }   
    });

});

// ═════════════════════ POST ══════════════════════
app.post("/onupload", function(req, res){
    const file = req.files.filename;
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true){
            // Berechnet den MD5 Hash von der Datei
            const tempmd5 = md5(file);
            const usrmd5 = md5(usr);

            var fs = require('fs');
            // Erstellt den Unterordner wenn es nicht existiert
            if (!fs.existsSync(__dirname + "/upload/" + usrmd5)){
                fs.mkdirSync(__dirname + "/upload/" + usrmd5);
            }

            // Speichert die Datei unter "upload" und benutzt den md5 hash
            file.mv(__dirname + "/upload/" + usrmd5 + "/" + tempmd5 + "_" + file.name);

            // Ließt alle Hochgeladenen Dateien
            var dateiarray = []
            fs.readdir(__dirname + "/upload/" + usrmd5 + "/", (err, files) => {
                files.forEach(file => {
                    // Fügt alle Elemente in Ordner zu Array zu
                    dateiarray.push(usrmd5 + "/" + file);
                });
                res.render("uploads", {"uploads": dateiarray});
            });
        }else{
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login", {"errorText": "Bitte einloggen!"});
        }   
    });



});

// ═══════════════════ Login POST ════════════════════
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(username, password, rows) == true){
            const maxAge = 3600*1000; //eine Stunde
            res.cookie('user', username, {'maxAge':maxAge});
            res.cookie('pass', password, {'maxAge':maxAge});
            res.redirect("/");
        }else{
            res.render("login", {"errorText": "Benutzername oder Passwort falsch!"});
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
                        // Fügt den Benutzer zur Datenbank hinzu
                        benutzerHinzufuegen(username, password);
                        // Setzt die Cookies, damit der User direkt anfangen kann
                        res.cookie('user', username, {'maxAge':maxAge});
                        res.cookie('pass', password, {'maxAge':maxAge});
                        // Redirect zur Main Page
                        res.redirect("/");
                    }else{
                        res.send("Benutzer existiert bereits!");
                    }
                }
            );
            }else{
                res.render("register", {"errorText": "Passwörter stimmen nicht überein!"});
            }        
        }else{
            res.render("register", {"errorText": "Passwort zu kurz! (min. 8 Zeichen)"});
        }
    }else{
        res.render("register", {"errorText": "Benutzername zu kurz! (min. 4 Zeichen)"});
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
