"use strict";

module.exports = function () {
    var env = process.env.NODE_ENV || 'development';
    var appConstants = applicationConfig();

    var obj = {
        application: {
            url: appConstants['url'],
            host: appConstants['host'],
            port: appConstants['port'],
            httpPort: appConstants['httpPort'],
            env: env,
            isProd: function () {
                return env === 'production';
            }
        },
        clarifai:{
            secretKey: 'aa' // keys here
            publicKey: 'bb' 
        }
    }

    function applicationConfig() {
        return {
            'url': 'https://' + process.env.NODE_HOST + ':' +
                process.env.NODE_PORT,
            'host': process.env.NODE_HOST,
            'port': process.env.NODE_PORT,
            'httpPort': process.env.NODE_HTTP_PORT
        };
    }
    return obj;
}();
