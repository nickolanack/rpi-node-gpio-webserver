/**
 * 
 */

var WebsocketControlQuery=new Class({
		Implements:Events,
		initialize:function(url){

			var me=this;
			me._ws=false;
			
			me._handlers=[];
			me._timers=[];
			
			me._counter=0;

			try{

				//attempt websocket connection...
				if(window.GeoliveAjaxWebsocketServer){

					var ws = new WebSocket(url);
					console.log('started websocket: ws');
					
					ws.onopen=function(){
						me._ws=ws;
						me.fireEvent('onConnect');
					}

					ws.onerror=function(){
						console.log('recieved error! ');			
					}

					ws.onmessage=function(message){
						me._handleMessage(message);
					};
				}

			}catch(e){
				console.log('error connecting to websocket');
			}



		},
		execute:function(task, json, callback){
			var me=this;
			var c=me._counter;
			me._counter++;
			
			me._handlers['_'+c]=callback;	
			me._ws.send(JSON.stringify({id:c, task:task, json:json}));
			me._timers['_'+c]=window.performance.now();
		},
		_handleMessage:function(message){
			var me=this;
			
			var data=message.data;
			var i=data.indexOf(':');
			var id=data.substring(0,i);
			data=data.substring(i+1);
			
			
			if(!me._handlers['_'+id]){
				
				console.log("unhandled message: "+data)
				
			}else{
				var time=window.performance.now()-me._timers['_'+id];
				me._handlers['_'+id](data);
				console.log('ws '+id+':'+time);
				delete me._timers['_'+id];
				delete me._handlers['_'+id];
			}
		}


	});