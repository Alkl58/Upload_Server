// ════════════════ Initialisierung ══════════════════
// Initialisierung Express.js
const express = require("express");
const app = express();

//Initialisierung express-sessions
const session = require('express-session');
app.use(session({
    secret : 'Pfeil',
    saveUninitialized : false,
    resave : false
}));


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
app.listen(8080, function(){
    console.log("Server auf Port 80 gestartet");
});

app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname + '/upload'));

// ══════════════════ MainPage GET ═══════════════════
app.get("/", function(req, res){
    if (!req.session.username){
        res.render("index", {"message": "Bitte einloggen!", "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
    }else{
        res.render("index", {"message":  "Willkommen " + req.session.username, "UserLoginLogout": "Logout", "UserLoginLogoutHref": "/sessionLoeschen"});
    }
});

// ═══════════════════════ CP ════════════════════════
app.get("/cp", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true)
        {
            if(usr == "admin")
            {
                db.all(
                    'SELECT * FROM users',
                    function(err, rows){
                        res.render("cp", {"user": rows});
                    }
                );
            }
            else
            {
            // Redirect wenn nicht admin
            res.render("login",{ "message": "Einloggen","errorText": "Nur Admins haben Zugriff auf diese Funktion!", "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
            }
        }
        else
        {
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login",{ "message": "Einloggen","errorText": "Bitte einloggen!", "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
        }   
    });

});

// Benutzer löschen
app.post("/cp_delete/:id", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true)
        {
            if(usr == "admin")
            {
                db.run(`DELETE FROM users WHERE id=${req.params.id}`, function(err){
                    res.redirect("/cp");
                }
            );
            }
            else
            {
                // Redirect wenn nicht admin
                res.render("login", {"errorText": "Nur Admins haben Zugriff auf diese Funktion!"});
            }
        }
        else
        {
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login", {"errorText": "Bitte einloggen!"});
        }   
    });
});

// Nutzer bearbeiten
app.post("/cp_update/:id", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true)
        {
            if(usr == "admin")
            {
                db.all(`SELECT * FROM users WHERE id = ${req.params.id}`, function(err, rows){
                    res.render("cp_update", {"user": rows[0].name, "pw": rows[0].pw, "id": rows[0].id})
                });
            }
            else
            {
                // Redirect wenn nicht admin
                res.render("login",{ "message": "Einloggen","errorText": "Nur Admins haben Zugfriff auf diese Funktion!", "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
            }
        }
        else
        {
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login",{ "message": "Einloggen","errorText": null, "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
        }   
    });
});

app.post("/cp_submitupdate/:id", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;
    const param_user = req.body.username;
    const param_pw = req.body.pw;
    const param_id = req.params.id;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true)
        {
            if(usr == "admin")
            {
                db.run(
                    `UPDATE users SET name="${param_user}", pw="${param_pw}" WHERE id=${param_id}`,
                    function(err){
                        res.redirect("/cp");
                    }
                );
            }
            else
            {
                // Redirect wenn nicht admin
                res.render("login", {"errorText": "Nur Admins haben Zugriff auf diese Funktion!"});
            }
        }
        else
        {
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login", {"errorText": "Bitte einloggen!"});
        }   
    });


});

// ════════════════════ Login GET ════════════════════ 
app.get("/login", function(req, res){ 
    if (!req.session.username){
        res.render("login",{ "message": "Einloggen","errorText": null, "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
    }
    else{
        res.render("login",{'message': "Willkommen " + req.session.username,"errorText": null, "UserLoginLogout": "Logout", "UserLoginLogoutHref": "/sessionLoeschen"});
    }
    //res.render("login", {"errorText": null});
});
// ══════════════════ Register GET ═══════════════════
app.get("/register", function(req, res){
    if (!req.session.username){
        res.render("register",{ "message": "Registrieren","errorText": null, "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
    }
    else{
        res.render("register",{'message': "Willkommen " + req.session.username,"errorText": null, "UserLoginLogout": "Logout", "UserLoginLogoutHref": "/sessionLoeschen"});
    }
}); 

app.get("/uploads", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    if (!req.session.username){
        message = null;
    }
    else{
        message =  req.session.username;
    }

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
                var uploadsCount = 0;
                var errText = null;
                files.forEach(file => {
                    // Fügt alle Elemente in Ordner zu Array zu
                    dateiarray.push(file);
                    uploadsCount = 1;
                });
                if (uploadsCount == 0){
                    errText = "Keine Uploads!";
                }
                res.render("uploads", {"uploads": dateiarray, "usr": usrmd5 + "/", "errorText": errText, "UserLoginLogout": "Logout", "UserLoginLogoutHref": "/sessionLoeschen"});
            });
        }else{
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login",{ "message": "Einloggen","errorText": null, "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
        }   
    });

});

// ═════════════════════ POST ══════════════════════
app.post("/onupload", function(req, res){


    if (!req.files){
        res.redirect("/");

    }else{

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
    
                res.redirect("/uploads");
            }else{
                // Redirect wenn nicht eingeloggt oder cookie falsch
                res.render("login",{ "message": "Einloggen","errorText": null, "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
            }   
        });
    }
});

// ═══════════════════ Login POST ════════════════════
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    const param_sessionValue = req.body.username; //
    

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(username, password, rows) == true){
            const maxAge = 3600*1000; //eine Stunde
            req.session.username = param_sessionValue; //
            res.cookie('user', username, {'maxAge':maxAge});
            res.cookie('pass', password, {'maxAge':maxAge});
            res.redirect("/");
        }else{
            res.render("login",{ "message": "Einloggen","errorText": "Benutzername oder Passwort falsch!", "UserLoginLogout": "Login", "UserLoginLogoutHref": "/login"});
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

// ════════════════ Datei Löschen POST ════════════════
app.post("/delete/:uploads", function(req, res){
    const usr = req.cookies.user;
    const pw = req.cookies.pass;

    db.all("SELECT * FROM users", function(err, rows){
        if (anmeldungErfolgreich(usr, pw, rows) == true){
            // Berechnet den MD5 Hash von der Datei
            const usrmd5 = md5(usr);
            console.log(req.params.uploads);
            var fs = require('fs');
            // Löscht die Datei
            try 
            {
                // Lösche Datei
                fs.unlinkSync(__dirname + "/upload/" + usrmd5 + "/" + req.params.uploads)
            } catch(err) {
                console.error(err)
            }

            //
            res.redirect("/uploads");
        }else{
            // Redirect wenn nicht eingeloggt oder cookie falsch
            res.render("login", {"errorText": "Bitte einloggen!"});
        }   
    });
});

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
                        const maxAge = 3600*1000; //eine Stunde
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
        if (rows[i].name == benutzername){
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

// ============= Session Variable Loeschen (LOGOUT) ====================
app.get("/sessionLoeschen", function(req,res){
    res.clearCookie("user"); //zerstoert die Session Variable
    res.clearCookie("pass");
    res.clearCookie("connect.sid");
    res.redirect('/login');
    
})
