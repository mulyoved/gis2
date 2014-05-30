GIS2
===
GIS Feature sample application

Debug on real iPad
------------------

ngrok +  weinre
=====
Bash:

install: `npm -g install weinre`

to start: `weinre --httpPort 80`

will start on http://localhost:80

https://github.com/inconshreveable/ngrok

ngrok needed in order to publish the weinre on the internet

cmd: `d:\mobile\ngrok -authtoken gyY0-c3nlFJrQKnOpLa4 80`

will do something like `http://2e01b290.ngrok.com -> 127.0.0.1:80`

in index.html

`<script src="http://2e01b290.ngrok.com/target/target-script-min.js#anonymous"></script>`


PhoneGap Developer App
-------------
Install PhoneGap Developer App on device

Add .cordova folder to make the project PhoneGap compatible

`grunt copy:all`

`phonegap serve`

