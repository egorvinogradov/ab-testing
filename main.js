var nodeStatic = require('node-static');
var http = require('http');
var url = require('url');


/* Common */

console._log = console.log;
console.log = function(){
    Array.prototype.unshift.call(arguments, new Date() + ':\n');
    Array.prototype.push.call(arguments, '\n');
    console._log.apply({}, arguments);
};

$ = {
    proxy: function(func, context){
        return function(){
            func.apply(context || {}, arguments);
        };
    }
};



/* Router */

var Router = function(){
    /** @constructor */
};

Router.prototype = {
    routes: {
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
        }
    },
    defaults: {
        staticFiles: {
            callback: function(options){
                console.log('Static file:', options.request.url);
                // TODO: get static file
                var mockData = {
                    ololo: 1111
                };
                options.success(
                    JSON.stringify(mockData)
                );
            }
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
        this.server = http.createServer($.proxy(this.onRequest, this));
        this.server.listen(port);
    },
    onRequest: function(request, response){
        console.log(request.url);
        this.selectRoute({
            request: request,
            response: response,
            success: $.proxy(function(data){
                console.log('On success');
                this.onSuccess(response, data);
            }, this),
            error: $.proxy(function(e){
                this.onError(response, e);
            }, this)
        });
    },
    selectRoute: function(options){
        var requestPathname = url.parse(options.request.url).pathname;
        for ( var routeName in this.router.routes ) {
            if ( this.router.routes[routeName].pathnameRegExp.test(requestPathname) ) {
                this.router.routes[routeName].callback(options);
                return;
            }
        }
        this.router.defaults.staticFiles.callback(options);
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
