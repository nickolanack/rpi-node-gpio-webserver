/**
 * 
 */

function printPage(){
	
	return 'hello world';
	
}




require('http').createServer(function(req, res) {  
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write(printPage());
  res.end();
}).listen(80, '127.0.0.1');


