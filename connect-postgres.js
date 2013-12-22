/*
 *	PostgreStore - Connect storage in a PostgreSQL database.
 */
var Store = require('connect').session.Store;
var pg = require('pg');

var PostgreStore = module.exports = function PostgreStore(options) {
	if (typeof options !== 'object') {
		throw TypeError;
	}

	// we support different configurations up to the schema level
	// start by looking for a configuration called 'sessions', then 'global', then the object itself is the configuration
	options = options.sessions || options.global || options;

	// first, see if there is a URL parameter to use
	var connection = options.url || {

	// otherwise build object from defaults
		host: options.host || 'localhost',
		port: options.port || 5432,
		user: options.user || process.env.USER,
		database: options.database || 'nodepg',
		password: options.password || ''
	};
	
	// save the schema where the sessions are kept, defaults to 'web' for compatibility with connect-pg
	this.schema = options.schema || 'web';

	// create the getClient method based on the above configuration
	this.getClient = function(callback) {
		pg.connect(connection, function(err, client) {
			if (err) {
				console.log(JSON.stringify(err));
			}
			if (client) {
				callback(client);
			}
		});
	};
};

PostgreStore.prototype = new Store();

PostgreStore.prototype.set = function (sid, sessData, callback) {
	var self = this;
	this.getClient(function (client) {
		var expiration = null;
		if (sessData.cookie) {
			if (sessData.cookie.expires) {
				expiration = sessData.cookie.expires;
			}
		}
		client.query('select ' + self.schema + '.set_session_data($1, $2, $3)',
			[sid, JSON.stringify(sessData), expiration],
			function (err, result) {
				if (err) {
					console.log(err.message);
				}
				if (result) {
					callback && callback();
				}
			}
		);
	});
};

PostgreStore.prototype.get = function (sid, callback) {
	var self = this;
	this.getClient(function (client) {
		client.query('select ' + self.schema + '.get_session_data($1)',
			[sid],
			function (err, result) {
				if (err) {
					console.log(err.message);
				}
				if (result) {
					if (result.rows.length) {
						callback(null, JSON.parse(result.rows[0].get_session_data));
					} else {
						callback(null, null);
					}
				}
			}
		);
	});
};

PostgreStore.prototype.destroy = function (sid, callback) {
	var self = this;
	this.getClient(function (client) {
		client.query('select ' + self.schema + '.destroy_session($1)',
			[sid],
			function (err, result) {
				if (err) {
					console.log(err.message);
				}
				if (result) {
					callback && callback();
				}
			}
		);
	});
};

PostgreStore.prototype.length = function (callback) {
	var self = this;
	this.getClient(function (client) {
		client.query('select ' + self.schema + '.count_sessions()',
			function (err, result) {
				if (err) {
					console.log(err.message);
				}
				if (result) {
					callback(null, result.rows[0].count_sessions);
				}
			}
		);
	});
};

PostgreStore.prototype.clear = function (callback) {
	var self = this;
	this.getClient(function (client) {
		client.query('select ' + self.schema + '.clear_sessions()',
			function (err, result) {
				if (err) {
					console.log(err.message);
				}
				if (result) {
					callback && callback();
				}
			}
		);
	});
};
