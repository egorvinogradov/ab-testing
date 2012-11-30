var http = require('http');
var url = require('url');
var nodeStatic = require('node-static');

/* Common */

console._log = console.log;
console.log = function(){
    Array.prototype.unshift.call(arguments, new Date() + ':\n');
    Array.prototype.push.call(arguments, '\n');
    console._log.apply({}, arguments);
};

var $ = {
    proxy: function(func, context){
        return function(){
            func.apply(context || {}, arguments);
        };
    },
    extend: function(){
        if ( arguments.length < 2 ) {
            return arguments[0];
        }
        var result = arguments[0] || {};
        for ( var i = 0, l = arguments.length; i < l; i++ ) {
            var obj = arguments[i];
            for ( var prop in obj ) {
                result[prop] = obj[prop];
            }
        }
        return result;
    }
};



var serverConfig = {
    errorPages: {
        '404': '/404.html',
        '500': '/500.html',
        'default': '/500.html'
    },
    staticServer: {
        defaultFileExtension: '.html',
        root: './static',
        cache: 600
    }
};


/* Router */

var Router = function(){
    /** @constructor */
};

Router.prototype = {
    api: {
        experiments: {
            pathnameRegExp: /\/experiments.*/,
            callback: function(options){
                console.log('Experiments:', options.request.url);
                options.success(JSON.stringify({
                    status: 'OK',
                    experiments: [
                        {
                            name: 'red_button_vs_blue_button',
                            targets: [
                                'index',
                                'catalog',
                                'promo'
                            ]
                        },
                        {
                            name: 'left_sidebar_vs_right_sidebar',
                            targets: [
                                'hotelpage',
                                'catalog',
                                'payment'
                            ]
                        }
                    ]
                }));
            }
        },
        group: {
            pathnameRegExp: /\/group.*/,
            callback: function(options){
                console.log('Group:', options.request.url);
                options.success(JSON.stringify({
                    status: 'OK',
                    user: {
                        id: 1,
                        group: 'test'
                    }
                }));
            }
        },
        error: {
            pathnameRegExp: /\/error.*/,
            callback: function(options){
                console.log('Error:', options.request.url);
                options.success(JSON.stringify({
                    status: 'OK'
                }));
            }
        },
        track: {
            pathnameRegExp: /\/track.*/,
            callback: function(options){
                console.log('Track:', options.request.url);
                options.success(JSON.stringify({
                    status: 'OK'
                }));
            }
        }
    },
    staticFiles: {
        callback: function(options){
            
            console.log('Static file:', options.request.url);
            
            var staticServer = new nodeStatic.Server(options.config.staticServer.root, {
                cache: options.config.staticServer.cache
            });

            staticServer.serve(options.request, options.response, $.proxy(function(error, result){
                
                if ( error ) {

                    var defaultFileExtension = options.config.staticServer.defaultFileExtension;
                    var defaultFileExtensionRegExp = new RegExp('/\\' + defaultFileExtension + '$', 'i');
                    
                    if ( !defaultFileExtensionRegExp.test(options.request.url) ) {

                        options.request.url = options.request.url.replace(/\/$/, '') + defaultFileExtension;
                        staticServer.serve(options.request, options.response, function(error, result){
                        
                            if ( error ) {

                                console.log('Error:', options.request.url, error);
                                var errorPageUrl = error.status in options.config.errorPages
                                    ? options.config.errorPages[error.status]
                                    : options.config.errorPages.default;

                                staticServer.serveFile(
                                    errorPageUrl,
                                    error.status,
                                    {},
                                    options.request,
                                    options.response
                                );
                            }
                        });
                    }
                }
            }, this));
        }
    }
};



/* Server */

var Server = function(){
    /** @constructor */
};

Server.prototype = {
    initialize: function(router, port, config){
        this.config = config;
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
        for ( var routeName in this.router.api ) {
            if ( this.router.api[routeName].pathnameRegExp.test(requestPathname) ) {
                this.router.api[routeName].callback(options);
                return;
            }
        }
        this.router.staticFiles.callback(
            $.extend(options, {
                config: this.config
            }
        ));
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
server.initialize(router, port, serverConfig);
console.log('Server started on ' + port);
