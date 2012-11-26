var http = require('http');
var url = require('url');

var port = process.env.PORT || 5000;
var proxy = function(request, response){

    console.log('url', request.url);
    
    var chunks = [];
    var headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'X-Booking-AID, X-Booking-Pageview-Id, X-Booking-Session-Id' // TODO: find out how to allow all
    };
    var loaderOptions = {
        host: 'ostrovok.ru',
        port: 80,
        path: url.parse(request.url).pathname + url.parse(request.url).search,
        method: 'GET'
    };

    var closeConnection = function(statusCode, headers, data){
        response.writeHead(statusCode, headers);
        response.write(data);
        response.end();
    };

    var joinObjects = function(obj1, obj2){
        for ( var key in obj2 ) {
            obj1[key] = obj2[key];
        }
    };

    var loader = http.request(loaderOptions, function(res){
        console.log('response', res.statusCode, '\n', res.headers, '\n\n');
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            console.log('data', chunk, '\n\n');
            chunks.push(chunk);
            joinObjects(headers, res.headers);
        });
        res.on('end', function(){
            closeConnection(200, headers, chunks.join(''));
        });
    });

    loader.on('error', function(e){
        console.log('error', e, '\n\n');
        closeConnection(500, headers, JSON.stringify({
            status: 500
        }));
    });

    loader.end();
};

http.createServer(proxy).listen(port);
