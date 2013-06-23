var http = require("http");
var sqlite = require("sqlite3");
var db = new sqlite.Database("tbd.sqlite3");
var fs = require("fs");
var index  = fs.readFileSync("./index.html").toString()

db.get("SELECT name FROM sqlite_master WHERE name='tbd'", function(err,row) {
	if(row == undefined) {
		console.log("Missing database table 'tbd', attempting to create");
		db.run("CREATE TABLE tbd (tbd_id char(128), ts timestamp, blob text)",function(e) {
			if(e == null) {
				console.log("Created new database table 'tbd'");
				db.run("CREATE INDEX tbd_index ON tbd(tbd_id,ts);",function(e2) {
					if(e2 == null) {
						console.log("Created new database index on 'tbd(tbd_id,ts)'");
					} else {
						console.log("Unable to create database index on 'tbd(tbd_id,ts)', exiting plugin");
					}
				});
			} else {
				console.log("Unable to create database table 'tbd', exiting plugin");
			}
		});
	}
});

var server = http.createServer();
server.on("request",function(req,res){
	if(req.method.match(/get/i)) {
		var id = req.url.replace(/^\/(\d+)\/?$/,"$1");
		if(!id.match(/^\d+$/)) {
			res.writeHead(404);
			res.end("404-2");
			return;
		}
		db.get("select * from tbd where tbd_id=? order by ts desc limit 1",id,function(err,row) {
			if(row != null) {
				console.log("Found blob for " + id);
				var blob = row.blob;
				var page = index.replace(/%ciphertext%/,blob);
				res.writeHead(200,{"Content-Length": page.length});
				res.end(page);
			 } else {
				console.log("Unable to find blob for " + id);
				var page = index.replace(/%ciphertext%/,"");
				res.writeHead(200,{"Content-Length": page.length});
				res.end(page);
			}
		});
	} else if(req.method.match(/put/i)) {
		var id = req.url.replace(/^\/(\d+)\/?$/,"$1");
		if(!id.match(/^\d+$/)) {
			res.writeHead(404);
			res.end("404-2");
		}
		req.on("data", function(chunk) {	
			console.log("chunk\t"+chunk);		
			db.run("insert into tbd values(?,datetime('now','localtime'),?)",id,chunk,function(err) {
				if(err == null) {
					db.get("select tbd_id,ts from tbd where tbd_id=? order by ts desc limit 1",id,function(err,row) {
						if(row != null) {
							var page = "{\"version\":\"%d\"}".replace(/%d/,row.ts);
							res.writeHead(200,{"Content-Length": page.length});
							res.end(page);
						} else {
							res.writeHead(500);
							res.end("500-2");
						}
					});
				} else {
					res.writeHead(500);
					res.end("500");
				}
			});
		});
	}else {
		res.writeHead(404);
		res.end("404");
		console.log("404\t" + req);
	}
});


server.listen(8181);
