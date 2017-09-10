'use strict';

const requireFrom = require('requirefrom');
const bakar = require('winston');

const mainController = requireFrom('nodesrc/controllers')('main');

module.exports = [
    {
    method: 'GET',
    path: '/',
    config: {
    	auth: false,
        handler: function (request, reply) {
            mainController.test(request, reply);
        }
    }
}];
