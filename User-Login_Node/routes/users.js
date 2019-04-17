const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
var moment = require('moment');
const crypto = require('crypto');
global.user_email;
global.user_name;
const connection = mysql.createConnection({
    host     : 'db-intern.ciupl0p5utwk.us-east-1.rds.amazonaws.com', //mysql database name
    port     :  '3306',
    user     : 'dummyUser', //mysql database username
    password : 'dummyUser01', //mysql database password
    database : 'db_intern' //mysql database name
});

connection.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

//login page
router.get('/login', (req, res) => res.render('login'));
//register page
router.get('/register', (req, res) => res.render('register'));
// user-search page
router.get('/persons', (req, res) => res.render('persons'));
//dashboard page
router.get('/dashboard', (req, res) => res.render('dashboard'));
//update page
router.get('/update', (req, res) => res.render('update'));

//REST API
router.get('/', function (req, res) {
    connection.query('SELECT * FROM userData', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

router.post('/persons', (req, res) => {
    var { search } = req.body;
    connection.query('SELECT userName, emailId, phoneNo FROM userData WHERE emailId = "' + search + '" ', function (error, results, fields) {
        if (results.length > 0) {
            res.render('persons', { query: results });
        } else {
            res.render('persons', { query: results });
        }
    })
});

//Register Handle
router.post('/register', (req, res) => {
    // console.log(req.body);
    // res.send('hello');
    var { name, email, phone, password, password2, time} = req.body;
    let errors = [];
    //check fields
    if (!name || !email || !phone || !password || !password2) {
        console.log(phone);
        errors.push({ msg: 'please fill in all fields' });
    }
    //check password match
    if (password != password2) {
        errors.push({ msg: 'passwords don\'t match' });
    }
    //check pass length
    if (password.length < 6) {
        errors.push({ msg: 'password should be atleast 6 characters' });
    }
    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            phone,
            password,
            password2
        })
    } else {
        // res.send('validation passed');
        connection.query('SELECT emailId FROM userData WHERE emailId = "'+ email +'" ', function (error, results, fields) {
            if (results.length > 0) {
                errors.push({ msg: 'Email is already registered' });
                res.render('register', {
                    errors,
                    name,
                    email,
                    phone,
                    password,
                    password2
                })
            } else {
                //Hash password
                let salt = crypto.randomBytes(16).toString('base64');
                // console.log(req.body.password);
                let hash = crypto.createHmac('sha256', salt).update(req.body.password).digest("base64");
                password = salt + "$" + hash;
                var time = moment().format();
                connection.query('INSERT INTO userData VALUES ("' + name + '","' + email + '","' + phone + '","' + password + '","' + time + '")', function (error, res) {
                    if (error) throw error;
                    console.log(name + " is inserted");
                });

                req.flash('success_msg', 'you are registered & can login!');
                res.redirect('/users/login');
            }
        });
    }
});

//Update Handle
router.post('/update', (req, res) => {
    var { name, phone, password, password2 } = req.body;
    //check password match
    var time = moment().format();
    let errors = [];
    if (name.length > 0) {
        connection.query('UPDATE userData SET userName = "' + name + '", dateTime = "' + time + '" WHERE emailID = "' + global.user_email + '"', function (error, results, fields) {
            if (error) throw error;
            console.log('name is updated');
        });
    }
    if (phone.length > 0) {
        connection.query('UPDATE userData SET phoneNo = "' + phone + '", dateTime = "' + time + '" WHERE emailID = "' + global.user_email + '"', function (error, results, fields) {
            if (error) throw error;
            console.log('phone is updated');
        });
    }
    if (password.length > 0) {
        if (password != password2) {
            errors.push({ msg: 'passwords don\'t match' });
        }
        //check pass length
        if (password.length < 6) {
            errors.push({ msg: 'password should be atleast 6 characters' });
        }
        if (errors.length > 0) {
            res.render('register', {
                errors,
                name,
                phone,
                password,
                password2
            })
        }
        let salt = crypto.randomBytes(16).toString('base64');
        // console.log(req.body.password);
        let hash = crypto.createHmac('sha256', salt).update(password).digest("base64");
        password = salt + "$" + hash;
        connection.query('UPDATE userData SET password = "' + password + '", dateTime = "' + time +'" WHERE emailID = "' + global.user_email + '"', function (error, results, fields) {
            if (error) throw error;
            console.log('password is updated');
        });
    }
    if (name.length > 0) {
        res.render('dashboard', { query: name });
    } else {
        res.render('dashboard', { query: global.user_name });
    }
});

//Login Handle
router.post('/login', (req, res) => {
    let errors = [];
    var email = req.body.email;
    var password = req.body.password;
    global.user_email = email;
    connection.query('SELECT * FROM userData WHERE emailId = "'+ email +'" ', function (error, results, fields) {
        if (error) throw error;

        //match password
        if (results.length > 0) {
            let passwordField = results[0].password.split('$');
            let salt = passwordField[0];
            let hash = crypto.createHmac('sha256', salt).update(req.body.password).digest("base64");
            let tosplit = hash.split(passwordField[1]);
            let toMatch = hash.split(tosplit[1]);
            global.user_name = results[0].userName;
            if (toMatch[0] == passwordField[1]) {
                console.log('user ' + results[0].userName + ' is matched. Wohooo!');
                res.render('dashboard', { query: results[0].userName });
                //TODO:

            } else {
                errors.push({ msg: 'Incorrect Password!' });
                res.render('login', {
                    errors,
                    email
                })
            }
        } else {
            req.flash('error_msg', 'Email does\'nt exist you need to register first!');
            res.redirect('/users/register');
        }
    });
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.flash('success_msg', 'You are logged out!');
    res.redirect('/users/login');
});



module.exports = router;
