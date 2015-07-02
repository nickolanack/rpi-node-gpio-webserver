# rpi-node-gpio-webserver
a nodejs webserver for raspberry-pi that provides an interface to control/monitor general purpose io pins.

#install
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

#Pin Configuration

