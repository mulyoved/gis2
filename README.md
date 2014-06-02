<img src="https://www.codeship.io/projects/c2913530-cc5c-0131-1402-02f1b5f2329d/status"></img>

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

Issues
-----------
if location service not run
`adb logcat AndroidRuntime:E dalvikvm:S GCM:D memtrack:S android.os.Debug:S eglCodecCommon:S jdwp:S linker:E SoundPool:S AudioService:S IInputConnectionWrapper:E WindowManager:E`

Need to add to AndroidManifest.xml (Config.xml?)

When adding platform need to add those

<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

Publish Application
---------------------
Create key store
keytool -genkey -v -keystore /d/js/KeyStore/gis2-release-key.keystore -alias gis2 -keyalg RSA -keysize 2048 -validity 10000

Create/Update ant.properties
key.store=/js/KeyStore/gis2-release-key.keystore
key.alias=gis2

Convert icons
http://www.appiconsizes.com/

http://makeappicon.com/ (This one maybe better and more aligned with the PhoneGap docs http://docs.phonegap.com/en/edge/config_ref_images.md.html

Configure icons in config.xml

create hook file after_prepare.js to copy the main icon

cordova Catch22build android --release