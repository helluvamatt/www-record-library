// Includes
var pg = require('pg');
var express = require('express');
var fs = require('fs');

var PostgreStore = require('./connect-postgres.js');
var PgConfig = require('./pg-config.js');

// configuration loaded in memory
var config = {};

// load configuration
fs.readFile('config.json', function(err, data) {
	
	// read configuration
	if (!err && data)
	{
		config = JSON.parse(data);
	}
	config.secret = config.secret || process.env.SECRET;
	config.database = new PgConfig(config.database || { "global": { url: process.env.DATABASE_URL } });
	var sessionDatabase = config.database.get('sessions');

	// Configure Express application
	var app = express();
	app.use(express.json());
	app.use(express.urlencoded());
	app.use('/assets', express.static(__dirname + '/assets'));
	app.use(express.cookieParser());
	app.use(express.session({
		secret: config.secret,
		store: new PostgreStore(sessionDatabase)
	}));

	app.get('/', function(req, res) {
		res.send('hello world');
	});

	app.listen(3000);
	console.log('Server listening on port 3000.');

}); // end fs.readFile callback

