'use strict';
angular.module('Gis2.controllers', [])

.controller('SelfTestCtrl', function($rootScope, $state, $scope, $log, PubNub) {
    $scope.uuid = Math.random().toString(16).substring(2,15);
    var isServer = true;
    var socket;
    var lastPos = {};

    $scope.goMainPage = function() {
        $state.go('tab.friends');
    };

    $scope.map = {
        center: {
            latitude: 32.0813,
            longitude: 34.781768
        },
        zoom: 16,
        markers: [
            {
                id: 1,
                latitude: 32.0813,
                longitude: 34.781768,
                showWindow: false,
                title: 'Marker 1'
            },
            {
                id: 2,
                latitude: 32.0823,
                longitude: 34.7827,
                showWindow: false,
                title: 'Marker 2'
            }]
    };

    _.each($scope.map.markers, function (marker) {
        marker.closeClick = function () {
            marker.showWindow = false;
            $scope.$apply();
        };
        marker.onClicked = function () {
            $scope.onMarkerClicked(marker);
        };
    });

    $scope.onMarkerClicked = function (marker) {
        marker.showWindow = true;
        $scope.$apply();
    };


    $scope.doLog = function() {
        $scope.socketStatus = new Date();
        console.log('Sample Log Message, text only');
        console.log('Sample Log Message, simple params', 'ok', 1, true);
        console.log('Sample Log Message, object', $scope);

        console.log('Sample Log Message, text only');
    };

    console.log('uuid', $scope.uuid);

    var onSuccess = function(position) {
        lastPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitude_Accuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
        };
        $scope.$apply(function() {
            $scope.gisInfo = JSON.stringify(lastPos, null, 2);
            //$scope.map.center = lastPos;
            $scope.map.center =lastPos;
            $scope.$broadcast('event:gislocation', lastPos);
        });

    };

    var onError = function(error) {
        var err = {
            error_code: error.code,
            message: error.message
        };

        $scope.$apply(function() {
            $scope.gisInfo = JSON.stringify(err, null, 2);
        });
    };

    $scope.getGISLocation = function() {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
        console.log('getCurrentPosition');
    };

    $scope.watchGISLocation = function() {
        /* Unreliable http://stackoverflow.com/questions/13254420/phonegap-cordova-watchposition-fire-success-every-1-second
        var options = { maximumAge: 10000, timeout: 60000 * 3, enableHighAccuracy: true };
        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        console.log('Watch', watchID);
        */

        var activeWatch = setInterval(function() {
            navigator.geolocation.getCurrentPosition(onSuccess, onError);
        }, 5000);

    };

    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    var setSocketStatus = function(text) {
        $scope.safeApply(function() {
            $scope.socketStatus = text;
        });
    };
    setSocketStatus("undefined");

    $scope.InitSocketIO = function() {
        //var serverAddress = "http://10.0.2.2:8080";
        var serverAddress;
        if (isServer) {
            serverAddress = "gisserver.herokuapp.com:80";
        }
        else {
            serverAddress = "http://localhost:8080";
            if (ionic.Platform.isWebView()) {
                serverAddress = "http://10.0.2.2:8080";

            }
        }

        console.log('Connecting to', serverAddress);
        socket = io.connect(serverAddress);

        setSocketStatus("connecting");

        socket.on('load:request_coords', function (data) {
            console.log('load:request_coords', data);
            $scope.$apply(function() {
                $scope.socketServerAnswer = JSON.stringify(data, null, 2);
            });
        });

        socket.on('load:coords', function (data) {
            console.log('load:coords', data);
            $scope.$apply(function() {
                $scope.socketServerAnswer = JSON.stringify(data, null, 2);
            });
        });

        socket.on('load:test', function (data) {
            console.log('load:test', data);
            $scope.$apply(function() {
                $scope.socketServerAnswer = data;
            });
        });

        socket.on('ping', function (data) {
            $scope.$apply(function() {
                $scope.socketServerAnswer = data.message
            });
            socket.emit('pong', { message: 'Hello from client!' });
        });

        socket.on('connect', function (data) {
            console.log('Connected', data, socket.socket.sessionid);
            setSocketStatus("connected");
        });

        socket.on('reconnect', function () {
            setSocketStatus("reconnect");
        });

        socket.on('disconnect', function () {
            setSocketStatus("disconnect");
        });

        socket.on('reconnecting', function () {
            setSocketStatus("reconnecting...");
        });

        socket.on('error', function () {
            setSocketStatus("error");
        });
    };

    $scope.sendBySocket = function() {
        console.log('Send By Socket');

        socket.emit('send:test', {
                data: 'Test Message'
            });
    };

    $scope.sendLocation = function() {
        console.log('Send Location');

        socket.emit('send:coords', {
            id: $scope.uuid,
            data: lastPos
        });
    };

    $scope.requestLocations = function() {
        console.log('Eequest Locations');

        socket.emit('send:request_coords', {
            id: $scope.uuid,
            socketid: socket.socket.sessionid
        });
    };

    //PubNub
    $scope.PubNub_Init = function() {
        console.log('PubNub_Init');

        PubNub.init({
            publish_key: 'pub-c-7d9f3531-eb29-4da1-a030-734b93eb9bf9',
            subscribe_key: 'sub-c-46b73814-e64e-11e3-a931-02ee2ddab7fe',
            uuid: $scope.uuid});

        PubNub.ngSubscribe({ channel: 'test' });
        PubNub.ngSubscribe({ channel: 'gisinfo' });

        $rootScope.$on(PubNub.ngMsgEv('gisinfo'), function(event, payload) {
            $scope.$apply(function() {
                $scope.socketServerAnswer = JSON.stringify(payload, null, 2);
            });
            console.log('Incomming Data from', event, payload);
        });

        $rootScope.$on(PubNub.ngMsgEv('test'), function(event, payload) {
            // payload contains message, channel, env...
            console.log('Test: got a message event:', event, payload);
        });


        /*
        PubNub.ngSubscribe({
            channel: 'coords',
            callback: function(data) {
                $scope.$apply(function() {
                    $scope.socketServerAnswer = JSON.stringify(data, null, 2);
                    console.log('Incomming Data from', data);
                });
            }
        });
        */
    };

    $scope.PubNub_sendBySocket = function() {
        console.log('PubNub_sendBySocket');

        PubNub.ngPublish({
            channel: 'test',
            message: 'Test Message'
        });
    };

    $scope.PubNub_sendLocation = function() {
        console.log('PubNub_sendLocation');

        lastPos.id = $scope.uuid;
        PubNub.ngPublish({
            channel: 'gisinfo',
            message: lastPos
        });
    };

    $scope.PubNub_reportLocation = function() {
        console.log('PubNub_reportLocation');
        $scope.$on('event:gislocation', function(event, lastPos) {
            console.log('PubNub_reportLocation', lastPos);
            lastPos.id = $scope.uuid;
            PubNub.ngPublish({
                channel: 'gisinfo',
                message: lastPos
            });
        });
    };

    $scope.PubNub_requestLocations = function() {
        console.log('PubNub_requestLocations');
        PubNub.ngHistory({channel:'gisinfo', count:500});
    };

    $scope.PubNub_ngListChannels = function() {
        var channels = PubNub.ngListChannels();
        console.log(channels);
    };

    $scope.setMapLocation = function() {
        $scope.map.center = {
            latitude: lastPos.latitude,
            longitude: lastPos.longitude
        } ;
        $log.log('set center', $scope.map.center);
    };
})

.controller('FriendsCtrl', function($scope, $log, $timeout, Gis) {
    //google.maps.visualRefresh = true;

    $scope.$on('gis-peer-location', function(event, markers) {
        $log.log('Update markers');
        $scope.map.markers = Gis.getMarkers();
    });

    /*
    $scope.$on('gis-location', function(event, pos) {
        $scope.map.center = {
            latitude: pos.latitude,
            longitude: pos.longitude
        };

        $log.log('gis-location even, center map', $scope.map.center);
    });
    */

    $scope.item = {
        text: "String"
    };

    $scope.map = {
        center: Gis.myPosition,
        options: {
            disableDefaultUI: true
        },
        zoom: 16,
        markers: Gis.getMarkers()
    };

    $scope.centerMap = function() {
        var pos = Gis.myPosition;
        $scope.map.center = {
            latitude: pos.latitude,
            longitude: pos.longitude
        } ;

        $log.log('set center', $scope.map.center);
    };

    $log.log('FriendsCtrl ready');
})

.controller('AccountCtrl', function($scope, $state, ConfigService) {
    $scope.setup = ConfigService;
    $scope.selfTest = function() {
        $state.go('self-test');
    };
});
