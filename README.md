# rpi-node-gpio-webserver
A nodejs webserver for raspberry-pi that provides an interface to control/monitor general purpose io pins. currently only output pins have been implemented 

This project does not proved any access control, make sure that your raspberry pi is not visible outside your local area network, to prevent unauthorized access.

I would like to compile some safe/inexpensive optocuppler/triac circuits for manipulating real devices such as home lighting, sprinker system solenoids, etc. contact me if you have any application uses or circuit ideas!

#Installation
on your raspberry pi, install node, npm and git. (I think git might be preinstalled...)

I've updated my node version to 0.12.0 using the adafruit packages at https://learn.adafruit.com/node-embedded-development/installing-node-dot-js

then run

```

git clone https://github.com/nickolanack/rpi-node-gpio-webserver.git
cd rpi-node-gpio-webserver
npm install
sudo node index.js

```

That should get a webserver listening on port 80, and a websocket server listening on 8080. 
The webserver displays a simple page with toggle switch controls for each gpio pin configured. 
The list of pins is queried (basically ajax but over a websocket) and toggle events are
also sent to the server via the websocket, to toggle the voltage level on the physical gpio pin. 

I'm working on simple push notifications to support multiple users being notified of state changes originating 
from other users, as well as to support input/sensor gpio pins.

#Pin Configuration

Most gpio pins can be configured as a toggle switches, just update the devices.json file.
currently only 'out' is supported for direction, and 'bool' for type, state contains the initial state
of the device currenlty only false is supported for initial states. 

Take a look at the pinout for your rpi board, the following configuration is for the Raspberry Pi2


```
//devices.json

[{
	name:'GPIO Pin 7',
	pin:7,
	direction:'out',
	type:'bool',
	state:false
},
{
	name:'GPIO Pin 11',
	pin:11,
	direction:'out',
	type:'bool',
	state:false
},
{
	name:'GPIO Pin 13',
	pin:13,
	direction:'out',
	type:'bool',
	state:false
},
{
	name:'GPIO Pin 15',
	pin:15,
	direction:'out',
	type:'bool',
	state:false
}
]

```

The previous config would produce a webpage that looks like:

![alt tag](https://raw.github.com/nickolanack/rpi-node-gpio-webserver/master/screen.png)
