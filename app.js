var express = require('express');
var app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use('/assets', express.static(__dirname + '/assets'));

// TODO PostgreSQL sessions

app.get('/', function(req, res) {
	// TODO
});

app.listen(3000);

