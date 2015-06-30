/**
 * 
 */
var fs=require('fs');
var http=require('http');


function printPage(req, res){
	res.writeHead(200, {
		'Content-Type': 'text/html'
	});

	fs.readFile('./html/index.html', function (err, data) {
		res.write(data);
		res.end();
	});
}


function printScript(req, res){
	res.writeHead(200, {
		'Content-Type': 'text/javascript'
	});

	fs.readFile('./html/script.js', function (err, data) {
		res.write(data);
		res.end();
	});
}


function printStylesheet(req, res){
	res.writeHead(200, {
		'Content-Type': 'text/css'
	});

	fs.readFile('./html/style.css', function (err, data) {
		res.write(data);
		res.end();
	});
}


function printRequest(req, res){
	res.writeHead(200, {
		'Content-Type': 'text/plain'
	});


	res.write(req.toString());
	res.end();
	
}


var server=http.createServer(function(req, res) {

	printRequest(req, res);

});

server.listen(8080);
