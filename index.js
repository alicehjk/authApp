const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const ensureLogin = require('connect-ensure-login');
const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'html')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/MyDatabase');

const UserSchema = new mongoose.Schema({ username: String, password: String });
UserSchema.plugin(plm);
const UserDetails = mongoose.model('userInfo', UserSchema, 'userInfo');

passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login?info=Invalid credentials' }),
  (req, res) => { res.redirect('/'); }
);

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

app.get('/', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

app.get('/private', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'private.html'));
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.sendFile(path.join(__dirname, 'html', 'logout.html'));
  });
});

app.get('/user', ensureLogin.ensureLoggedIn('/login'), (req, res) => {
  res.send({ user: req.user });
});

// seed users (run once, then comment out)
/*
(async () => {
  await UserDetails.register({ username: 'paul' }, 'paul');
  await UserDetails.register({ username: 'west' }, 'west');
  await UserDetails.register({ username: 'kim' }, 'kim');
  console.log('seeded users');
})();
*/

app.listen(PORT);
