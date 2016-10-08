const config = process.env.NODE_ENV === 'PROD' ? require('../config/config.js').PROD : require('../config/config.js').DEV;
const models = require('../../db/index');
const request = require('request');
const multiparty = require('multiparty');
const fs = require('fs');
const FormData = require('form-data');
const geohash = require('ngeohash');
const http = require('http');
const countries = require('../countries/countriesJSON');
const Promise = require('bluebird');

let isLoggedIn = (req) => req.session ? !!req.session.user : false;

module.exports = {
  sendToCurator,
  uploadPhoto,
  photos,
  stack,
  validPhoto,
  train
};

function train (req, res) {
  let counter = 1;
  let automate = function() {
    let config = {
      method: 'POST',
      uri: 'http://localhost:3002/getTrainingData'
    }
    request(config, (err, response, body) => {
      if (err) {
        console.log(err);
      } else {
        if (counter <= 49) {
          counter++;
          automate();
        } else {
          res.send();
        }
      }
    })
  };
  automate();
};

function sendToCurator (data) {
  let options = {
    uri: `${config.curator}/save`,
    method: 'POST',
    json: data
  };
  request(options, (err, response, body) => {
    if (err) {
      console.log('Error: ', err);
    }
  });
}

function sendToCuratorAsync (data) {
  let options = {
    uri: `${config.curator}/save`,
    method: 'POST',
    json: data
  };
  return new Promise((resolve, reject) => {
    request(options, (err, response, body) => {
      resolve(response);
      reject(err);
    }); 
  });
}

function stack(req, res) {
  let seed = req.query;
  getStack(seed, res);
}

function getStack(seed, res) {
  let options = {
    uri: `${config.curator}/getstack`,
    method: 'GET',
    qs: {
      id: seed.id,
      theme: seed.theme
    }
  };
  request(options, (err, response, body) => {
    if (err) {
      console.log('error in getting stack', err);
    }
    console.log('stack received', JSON.parse(body));
    var mapped = {};
    let parsed = JSON.parse(body);
    parsed.forEach( (photo, idx) => {
      console.log(photo, 'this is the current photo');
      mapped[idx] = {
        id: photo.key,
        url: photo.url,
        lat: photo.latitude,
        long: photo.longitude
      };
    });
    console.log(mapped, 'MAPPPED OBJECT');
    res.json(mapped);
  });
};


function uploadPhoto(req, res) {
  if (req.file) {
    let userID = req.session.user.id;
    let userLat = req.session.user.defaultLat;
    let userLong = req.session.user.defaultLong;
    let file = req.file;

    models.Photos.create({
      UserId: userID
    }).then( (photo) => {
      let photoId = photo.dataValues.id;

      var form = new FormData();
      form.append('theme', req.body.theme);
      form.append('name', req.file.originalname);
      form.append('photo', fs.createReadStream(`${__dirname}/../../${file.path}`), {
        contentType: 'image/jpg'
      });

      var r = request.post(`${config.photoProcessor}/photoProcessor/upload/${photoId}`, (err, response, body) => {
        body = JSON.parse(body);
        if (!body.gps) {
          body.gps = {};
          body.gps.lat = userLat;
          body.gps.long = userLong;
        }
        sendToCuratorAsync(body)
          .then((stack)=> {
            fs.unlink(`${__dirname}/../../${file.path}`);
            savePhoto(body);
            res.json(body);
          });
      });
      r._form = form;     
    });
  }
}

function savePhoto(body) {
  models.Photos.findOne({where: {id: body.id}})
    .then((photo) => {
      console.log(body.theme, 'THE THEME');
      models.Themes.findOrCreate({where: {theme: body.theme}})
        .then((theme) => {
          photo.update({
            lat: body.gps.lat,
            long: body.gps.long,
            file_url: body.url,
            ThemeId: theme[0].dataValues.id
          });
        });
      return photo;
    })
    .then((photo) => {
      let keywordsPK = [];
      body.clarifaiKeywords.forEach((keyword) => {
        models.Keywords.findOrCreate({where: {keyword: keyword}})
          .then((keyword) => {
            keywordsPK.push(keyword[0].dataValues.id);
          })
          .then(() => {
            return photo.addKeywords(keywordsPK);
          })
          .catch((err) => {
            console.log('ERROR: ', err);
          });
      });
    }).catch((err) => {
      console.error('ERROR: ', err);
    }); 
}

function validPhoto(req, res) {
  req.pipe(request(`${config.photoProcessor}/photoProcessor/validPhoto`)).pipe(res);
};

function photos (req, res) {
  let userID = req.session.user.id;
  console.log('This is my user id in the GET /photos:', userID);
  models.Photos.findAll({ 
    where: {
      UserId: userID
    },
    // limit: 6,
    order: '"createdAt" DESC'
  }).then( (photos) => {
    res.send(photos);
    // workers.prepStacks(photos);
  }).catch((err) => {
    console.error('ERROR IN FIND ALL PHOTOS: ', err)
  })
} 


