const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const moment = require('moment');
const crypto = require('crypto');
const validator = require('express-validator');
const connection = require('../db_config');

// // user-search page
router.get('/persons', (req, res) => res.render('persons'));
//search page
router.get('/search', (req, res) => res.render('search'));
//update page
router.get('/update', (req, res) => res.render('update'));
//delete page
router.get('/delete', (req, res) => res.render('delete'));

//Users REST API
router.get('/', function (req, res) {
    connection.query('SELECT * FROM userData', function (error, results, fields) {
        if (error) throw error;
        res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
    });
});

// Persons handle
router.post('/persons', (req, res) => {
    var { search } = req.body;
    let errors = [];
    if (search.length == 0) {
        res.redirect('/users/search');
    } else {
        connection.query('SELECT userName, emailId, phoneNo, dateTime FROM userData WHERE emailId = "' + search + '" ', function (error, results, fields) {
            res.render('persons', { query: results });
        })
    }
});

//Update Handle
router.post('/update', (req, res) => {
    var { name, phone, email, password, password2 } = req.body;
    //check password match
    let errors = [];
    if (email.length == 0) {
        errors.push({ msg: 'Email required!' });
        res.render('update', {
            errors,
            name,
            phone,
            password,
            password2,
            email
        })
    } else {
        connection.query('SELECT emailId FROM userData WHERE emailId = "' + email + '" ', function (error, results, fields) {
            if (results.length > 0) {   // Email already registered, then => update.
                var time = moment().format();
                if (name.length > 0) {
                    connection.query('UPDATE userData SET userName = "' + name + '", dateTime = "' + time + '" WHERE emailID = "' + email + '"', function (error, results, fields) {
                        if (error) throw error;
                        console.log('name is updated');
                    });
                }
                if (phone.length > 0) {
                    connection.query('UPDATE userData SET phoneNo = "' + phone + '", dateTime = "' + time + '" WHERE emailID = "' + email + '"', function (error, results, fields) {
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
                        res.render('update', {
                            errors,
                            name,
                            email,
                            phone,
                            password,
                            password2
                        })
                    }
                    let salt = crypto.randomBytes(16).toString('base64');
                    // console.log(req.body.password);
                    let hash = crypto.createHmac('sha256', salt).update(password).digest("base64");
                    password = salt + "$" + hash;
                    connection.query('UPDATE userData SET password = "' + password + '", dateTime = "' + time + '" WHERE emailID = "' + email + '"', function (error, results, fields) {
                        if (error) throw error;
                        console.log('password is updated');
                    });
                }
                req.flash('success_msg', 'succesfully updated!');
                res.redirect('/users/update');
            } else {    // Email not registerd, then => insert
                req.check('email', 'Invalid email address').isEmail();
                //check fields
                var err_msg = req.validationErrors();
                if (err_msg != false) {
                    errors.push({ msg: err_msg[0].msg });
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
                    res.render('update', {
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
                    req.flash('success_msg', 'succesfully inserted!');
                    res.redirect('/users/update');
                }
            }
        });
    }
});

//Delete Handle
router.post('/delete', (req, res) => {
    let errors = [];
    var { search } = req.body;
    connection.query('DELETE FROM userData WHERE emailId = "'+ search +'" ', function (error, results, fields) {
        if (error) throw error;
        if (results.affectedRows == 0) {
            errors.push({ msg: 'Email is not in record' });
            res.render('delete', {
                errors,
                search
            })
        } else {
            req.flash('success_msg', 'succesfully deleted!');
            res.redirect('/users/delete');
        }
    });
});

module.exports = router;
