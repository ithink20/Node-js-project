const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const flash = require('connect-flash');
const validator = require('express-validator');
const session = require('express-session');

//EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

//Bodyparser
app.use(express.urlencoded({ extended: false }));

app.use(validator());

//Express Session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));



//connect flash
app.use(flash());

//global vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`));
