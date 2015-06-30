/**
 * 
 */
var fs=require('fs');
var http=require('http');



function printFile(file, res){
	
	fs.readFile('./html/'+file, function (err, data) {
		res.write(data);
		res.end();
	});
}




var server=http.createServer(function(req, res) {

	var file=req.url.split('/').pop();
	if(file.indexOf('.')>=0){
		
		
		
		fs.exists('./html/'+file, function(exists){
			
			if(exists){
				var contentTypes={
						js:'text/javascript',
						css:'text/css',
						html:'text/html',
							};
				
				var type=file.split('.').pop();
				res.writeHead(200, {
					'Content-Type': contentTypes[type]
				});
				printFile(file, res);
			
			}else{
				
				res.writeHead(404);
				res.end('File not found: '+file);
				
			}
			
			
			
		});
	}else{
		
		res.writeHead(500);
		res.end('resuest: '+file);
		
	}
	
	


});

server.listen(8080);
