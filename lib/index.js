const fs = require('fs');
const path = require('path');
const http = require('http');
const util = require('./util');
const basename = path.basename;
const server = require('./server');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');

const startListening = (app, server, parsedOptions) => {
    app.disable('x-powered-by');

    app.get('*', server.onRequest);

    //dont check content-type and just always try to parse body as json
    app.post('*', bodyParser.json({type: () => true}), server.onRequest);

    if (parsedOptions.unix) {
        try {
            fs.unlinkSync(path.resolve(parsedOptions.unix))
            //file removed
        } catch (err) {
        }

        app.listen(parsedOptions.unix, () => util.log(`Prerender server accepting requests on unix ${parsedOptions.unix}`));
    }
    else {
        app.listen(parsedOptions, () => util.log(`Prerender server accepting requests on port ${parsedOptions.port}`));
    }
}


exports = module.exports = (options = {
	logRequests: process.env.PRERENDER_LOG_REQUESTS === 'true'
}) => {
    const parsedOptions = Object.assign({}, {
        port: options.port || process.env.PORT || 3000
    }, options);

    server.init(options);
    server.onRequest = server.onRequest.bind(server);


    server.app = app;
    if (parsedOptions.customListen) {
        app.startListening = () => startListening(app, server, parsedOptions);
    }
    else {
        startListening(app, server, parsedOptions);
    }
    return server;
};

fs.readdirSync(__dirname + '/plugins').forEach((filename) => {
	if (!/\.js$/.test(filename)) return;

	var name = basename(filename, '.js');

	function load() {
		return require('./plugins/' + name);
	};

	Object.defineProperty(exports, name, {
		value: load
	});
});
