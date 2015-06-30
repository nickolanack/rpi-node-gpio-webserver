/**
 * 
 */
var fs=require('fs');
var http=require('http');


function printHtml(req, res){
	 	res.writeHead(200, {
		    'Content-Type': 'text/html'
		  });
	 	
		fs.readFile('./index.html', function (err, data) {
			res.write(data);
			res.end();
		});
		

}




var server=http.createServer(function(req, res) {
 
	printHtml(req, res));
  
});

server.listen(8080);
