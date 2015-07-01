/**
 * 
 */
var fs=require('fs');
var http=require('http');
var async=require('async');

var documentRoot='./html/';


var devices=[
      {
    	  name:'Pin 7',
    	  direction:'in',
      }                   
]


		
		
		



function printFile(file, res){
	
	
}




var server=http.createServer(function(req, res) {

	var file=req.url.split('/').pop();
	if(file===''){
		file='index.html';
	}
	if(file.indexOf('.')>=0){

		fs.exists(documentRoot+file, function(exists){
			
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
				file=file.replace(encodeURI(' | '), ' | ');
				async.map(file.split(' | '), function(part, callback){
					fs.readFile(documentRoot+file, function (err, data) {
						res.write(data);
						callback(null, part);
					});
				}, function(files){
					res.end();
				});
				
			
			
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
