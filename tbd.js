var http = require("http");
var fs = require("fs");
var index  = fs.readFileSync("./index.html")

var server = http.createServer();
server.on("request",function(req,res){
	if(req.method.match(/get/i) && req.url.match(/^\/?$/)) {
		res.writeHead(200,{"Content-Length": index.length});
		res.end(index);
	} else if(req.method.match(/put/i) && req.url.match(/^\/?$/)) {
		console.log(req.body);
		res.end("OK");
	}else {
		res.writeHead(404);
		res.end("404");
	}
});

server.listen(8181);
