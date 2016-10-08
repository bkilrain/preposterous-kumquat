const users = require('../controllers/user.controllers.js');
const photos = require('../controllers/photo.controllers.js');
var join = require('path').join;
const multer = require('multer');
const upload = multer({dest: './temp'});

module.exports = (app, express) => {
  app.use(express.static(join(__dirname, '/../../client')));

// STATIC LANDING PAGE
  app.get('/', (req, res) => {
    res.render();
  });
  
// CHECK SESSION
  app.get('/checkauth', users.requireLogin, (req, res) => {
    res.send(200);
  });

// SIGNUP
  app.post('/signup', (req, res) => {
    users.signup(req, res);
  });

// LOGIN
  app.post('/login', (req, res) => {
    users.login(req, res);
  });

// LOGOUT
  app.get('/logout', (req, res) => {
    users.logout(req, res);
  });

// GET USER DEETS
  app.get('/user/details', users.requireLogin, (req, res) => {
    users.user(req, res);
  });

// ADD PHOTO
  app.post('/upload', users.requireLogin, upload.single('photo'), (req, res) => {
    photos.uploadPhoto(req, res);
  });
  app.post('/savedPhoto', (req, res) => {
    photos.savedPhoto(req, res);
  });
  app.post('/validPhoto', (req, res) => {
    photos.validPhoto(req, res);
  });

// GET THUMBNAILS
  app.get('/photos', users.requireLogin, (req, res) => {
    photos.photos(req, res);
  });

// GET STACK
  app.get('/stack', users.requireLogin, (req, res) => {
    photos.stack(req, res);
  });
  
  app.post('/kickoffTraining', (req, res) => {
    photos.train(req, res);
  })
};
