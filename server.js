'use strict';
const Env = require('node-env-file');
// Load environment variables
Env(__dirname + '/.env', { raise: true });

const Hapi = require('hapi');
const Hoek = require('hoek');
const Boom = require('boom');
const bakar = require('winston');
const bakarRotate = require('winston-daily-rotate-file');


const constants = require('./nodesrc/config/constants.js');
const routes = require('./nodesrc/config/routes');

//configure bakar
bakar.add(bakarRotate, {
    name: 'app-log',
    filename: './logs/pixody.log',
    maxsize: '10000000',
    prettyPrint: process.env.NODE_ENV != 'production',
    level: constants.logging.level,
    json: false,
    maxFiles: '30',
    datePattern: '.yy-MM-dd'

});
bakar.add(bakar.transports.File, {
    name: 'crash-log',
    filename: './logs/error.log',
    level: 'error',
    json: false,
    handleExceptions: true,
    humanReadableUnhandledException: true
});
if (process.env.NODE_ENV == 'production') {
    bakar.remove(bakar.transports.Console);
}

const accessLogger = new(bakar.Logger)({
    transports: [
        new(bakarRotate)({ filename: './logs/access.log', datePattern: '.yy-MM-dd', maxsize: '50000000', maxFiles: '30', json: false })
    ],
    levels: { info: 0 }
});


/* Server init and hooks */
const server = new Hapi.Server();
var connectionOpts = { port: constants.application.port, host: constants.application.host };
// server.connection({ port: 3001, host: constants.application.host, labels: 'b'});
server.connection(connectionOpts);

server.start((err) => {
    if (err) {
        bakar.error('Error starting server', err);
        throw err;
    }

    server.connections.forEach(function (connection) {
        bakar.info('Server running at ' + connection.info.uri);
    });

});

server.ext('onPreResponse', function (request, reply) {


    return reply.continue();
});

server.on('response', function (request) {
    accessLogger.info(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode + ' | ' + request.headers['user-agent']);
});

/* End server settings */


/* 
 * Plugins to be registered here
 */


// tell your server about the defined routes
server.route(routes);
