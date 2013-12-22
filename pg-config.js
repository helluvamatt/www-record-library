var PgConfig = module.exports = function(configs) {

	// some defaults
	var globals = configs.global || {
		"host": "localhost",
		"port": 5432,
		"schema": "public"
	};

	// go over the given configs and merge in the globals
	var config;
	for ( config in configs ) {
		if (config == 'global') continue;
		var newConfig = globals;
		var param;
		for ( param in configs[config] )
		{
			newConfig[param] = configs[config][param];
		}
		configs[config] = newConfig;
	}

	// store configs (we are an object now)
	this.configs = configs;
};

// get a named config, or 'global' if it doesn't exist
PgConfig.prototype.get = function(configName) {
	return this.configs[configName] || this.configs['global'];
}

