'use strict';
angular.module('Gis2.controllers', [])

.controller('SelfTestCtrl', function($rootScope, $scope, $log, PubNub) {
    $scope.uuid = Math.random().toString(16).substring(2,15);
    var isServer = true;
    var socket;
    var lastPos = {};
    $scope.logMessages = '';
    /*
    function concat(array1, array2, index) {
        return array1.concat(Array.prototype.slice.call(array2, index));
    }

    (function(){
        var oldLog = $log.log;
        $log.log = function () {
            // DO MESSAGE HERE.
            //var msg = concat([], arguments, 0);
            var msg = '';
            var seen = [];
            for (var i = 0; i < arguments.length; i++) {
                msg += ', ' + JSON.stringify(arguments[i], function(key, val) {
                    if (typeof val == "object") {
                        if (seen.indexOf(val) >= 0)
                            return;

                        seen.push(val);
                    }
                    return val
                }, 2);
            }

            $scope.logMessages = $scope.logMessages + '\n' + msg;
            oldLog.apply(console, arguments);
        };
    })();
    */

    //var orgLog= $log.log;
    /*
    $log.log = function() {
        orgLog(arguments);
        var msg = '';
        for (var i = 0; i < arguments.length; i++) {
            msg += ', ' + arguments[i];
        }
        $scope.logMessages = msg + '\n' + $scope.logMessages;
    };
    */

    $scope.doLog = function() {
        console.log('Sample Log Message');
    };

    $log.log('uuid', $scope.uuid);

    var onSuccess = function(position) {
        lastPos = {
            Latitude: position.coords.latitude,
            Longitude: position.coords.longitude,
            Altitude: position.coords.altitude,
            Accuracy: position.coords.accuracy,
            Altitude_Accuracy: position.coords.altitudeAccuracy,
            Heading: position.coords.heading,
            Speed: position.coords.speed,
            Timestamp: position.timestamp
        };
        $scope.$apply(function() {
            $scope.gisInfo = JSON.stringify(lastPos, null, 2);
        });

    };

    var onError = function(error) {
        lastPos = {
            error_code: error.code,
            message: error.message
        };

        $scope.$apply(function() {
            $scope.gisInfo = JSON.stringify(lastPos, null, 2);
        });
    };

    $scope.getGISLocation = function() {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
        $log.log('getCurrentPosition');
    };

    $scope.watchGISLocation = function() {
        var options = { maximumAge: 6000, timeout: 20000, enableHighAccuracy: true };
        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
        $log.log('Watch', watchID);
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

        $log.log('Connecting to', serverAddress);
        socket = io.connect(serverAddress);

        setSocketStatus("connecting");

        socket.on('load:request_coords', function (data) {
            $log.log('load:request_coords', data);
            $scope.$apply(function() {
                $scope.socketServerAnswer = JSON.stringify(data, null, 2);
            });
        });

        socket.on('load:coords', function (data) {
            $log.log('load:coords', data);
            $scope.$apply(function() {
                $scope.socketServerAnswer = JSON.stringify(data, null, 2);
            });
        });

        socket.on('load:test', function (data) {
            $log.log('load:test', data);
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
            $log.log('Connected', data, socket.socket.sessionid);
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
        $log.log('Send By Socket');

        socket.emit('send:test', {
                data: 'Test Message'
            });
    };

    $scope.sendLocation = function() {
        $log.log('Send Location');

        socket.emit('send:coords', {
            id: $scope.uuid,
            data: lastPos
        });
    };

    $scope.requestLocations = function() {
        $log.log('Eequest Locations');

        socket.emit('send:request_coords', {
            id: $scope.uuid,
            socketid: socket.socket.sessionid
        });
    };

    //PubNub
    $scope.PubNub_Init = function() {
        $log.log('PubNub_Init');

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
            $log.log('Incomming Data from', event, payload);
        });

        $rootScope.$on(PubNub.ngMsgEv('test'), function(event, payload) {
            // payload contains message, channel, env...
            $log.log('Test: got a message event:', event, payload);
        });


        /*
        PubNub.ngSubscribe({
            channel: 'coords',
            callback: function(data) {
                $scope.$apply(function() {
                    $scope.socketServerAnswer = JSON.stringify(data, null, 2);
                    $log.log('Incomming Data from', data);
                });
            }
        });
        */
    };

    $scope.PubNub_sendBySocket = function() {
        $log.log('PubNub_sendBySocket');

        PubNub.ngPublish({
            channel: 'test',
            message: 'Test Message'
        });
    };

    $scope.PubNub_sendLocation = function() {
        $log.log('PubNub_sendLocation');

        lastPos.id = $scope.uuid;
        PubNub.ngPublish({
            channel: 'gisinfo',
            message: lastPos
        });
    };

    $scope.PubNub_requestLocations = function() {
        $log.log('PubNub_requestLocations');
        PubNub.ngHistory({channel:'gisinfo', count:500});
    };

    $scope.PubNub_ngListChannels = function() {
        var channels = PubNub.ngListChannels();
        $log.log(channels);
    };

})

.controller('FriendsCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('FriendDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('AccountCtrl', function($scope) {
});
