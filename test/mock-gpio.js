
var pins={};


module.exports={

	setup:function(pin, direction, callback){
		pins[pin]={value:0, direction:direction};
		callback(null);
	},

	read:function(pin, callback){
		callback(null, pins[pin].value);
	},

	write:function(pin, value, callback){
		pins[pin].value=value;
		callback(null);

	}
}