var nodeStatic = require('node-static');
var http = require('http');
var url = require('url');

console._log = console.log;
console.log = function(){
    Array.prototype.unshift.call(arguments, '[' + new Date() + ']:\n');
    Array.prototype.push.call(arguments, '\n');
    console._log.apply({}, arguments);
};

/* Router */

var Router = function(){
    /** @constructor */
};

Router.prototype = {
    experiments: {
        pathnameRegExp: /\/experiments.*/,
        callback: function(options){
            console.log('Experiments:', options.request.url);
        }
    },
    group: {
        pathnameRegExp: /\/group.*/,
        callback: function(options){
            console.log('Group:', options.request.url);
        }
    },
    error: {
        pathnameRegExp: /\/error.*/,
        callback: function(options){
            console.log('Error:', options.request.url);
        }
    },
    track: {
        pathnameRegExp: /\/track.*/,
        callback: function(options){
            console.log('Track:', options.request.url);
        }
    },
    staticFiles: {
        callback: function(options){
            console.log('Static file:', options.request.url);
        }
    }
};


/* Server */

var Server = function(){
    /** @constructor */
};

Server.prototype = {
    initialize: function(router, port){
        this.router = router;
        this.port = port;
        this.server = http.createServer(this.onRequest);
        this.server.listen(port);
    },
    onRequest: function(request, response){
        console.log(request.url);
        this.selectRoute({
            request: request,
            response: response,
            success: function(data){
                this.onSuccess(response, data);
            },
            error: function(e){
                this.onError(response, e);
            }
        });
    },
    selectRoute: function(options){
        var requestPathname = url.parse(options.request.url).pathname;
        for ( var route in this.router ) {
            if ( this.router[route].pathnameRegExp.test(requestPathname) ) {
                this.router[route].callback(options);
                return;
            }
        }
        this.router.staticFiles.callback(options);
    },
    onSuccess: function(response, data){
        response.writeHead(200, {
            'X-Powered': 'node.js'
        });
        response.write(data);
        response.end();
    },
    onError: function(response, e){
        response.writeHead(404, {
            'X-Powered': 'node.js'
        });
        response.write(JSON.stringify({
            status: 404
        }));
        response.end();
    }
};

var server = new Server();
var router = new Router();
var port = process.env.PORT || 3000;
server.initialize(router, port);
console.log('Server started on ' + port);
