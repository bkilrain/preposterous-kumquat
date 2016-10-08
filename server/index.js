const express = require('express');
const app = express();
const ports = require('./config/config.js');
const port = process.env.NODE_ENV === 'PROD' ? ports.PROD : ports.DEV;

const db = require('../db/index.js').sequelize;

require('./config/middleware.js')(app, express);
require('./config/routes.js')(app, express);

app.listen(port.main, function() {
  console.log('Listening on http://localhost:', port.main);
   db.sync().then(function() {
    console.log('Synced with PostgreSQL!');
  });
});
app.on('connection', (socket) => {
  socket.setTimeout(120 * 1000);
});
