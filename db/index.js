'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var config    = require(__dirname + '/migrations/config/config.json')[env];
var db        = {};

if (env === 'development') {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
} else {
  // var sequelize = new Sequelize(config.database, config.username, config.password, config);
  var sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://docker:docker@db:5432/app', { logging: false });
}

fs
  .readdirSync(__dirname + '/models')
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname + '/models', file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
