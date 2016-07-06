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

### Test Circuit
I used following circuit to test the rpi-gpio functionality. I used a 2N3904 General Purpose Transister becuase it 
is the cheapest one at digikey.com, there are many alternatives. you might be able drive an LED directly from a GPIO 
output pin. However, it is recomended to only output ~5mA per output pin so I designed my circuits to require less than that
(~3.5mA) and to use the 5v pin (GPIO pin 2) which I believe are powered directly from USB and have a much higher current rating.

In the following diagrams I label pins GPIO2(5v), GPIO7(io), and GPIO6(gnd) to represent pin numbers 2, 7, and 6. There may be alternate pin configurations and numbering depending on the rpi board although I believe these pins are consistent on all available boards. GPIO Pin 7 is 
refered to as GPIO-4 in the header pin diagrams. You should be able to use any io pin instead of pin 7 as long as you configure devices.json 
accordingly

<img src="https://raw.github.com/nickolanack/rpi-node-gpio-webserver/master/led-driver.png" height="260px"/>

### Relay Circuit

The following circuit uses a relay to switch high voltage AC/DC loads. The G5T-1A (This part is now obsolete: alternatives: ALDP105W PCH-105L2MH,000) is a low cost mechanical relay rated for 5A, 
at 250V AC or 30V DC. I intend to use this circuit to switch a small number of light bulbs ~60W @120VAC allows up to 10 bulbs max.

<img src="https://raw.github.com/nickolanack/rpi-node-gpio-webserver/master/relay-driver.png" height="300px"/>
