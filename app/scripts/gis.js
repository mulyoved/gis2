angular.module('Gis2.GISService',[])
    .factory('Gis', function($rootScope, $log, $q, $timeout, PubNub, ConfigService) {

        var uuid = Math.random().toString(10).substring(2,15);
        var addedFakeItems = false;

        var lastPos = {
                id: uuid,
                latitude: 32.0813,
                longitude: 34.781768
            };

        var queryLocationInterval = 3000;
        var channelName = 'GISInformation';
        var friends = {};

        var onSuccess = function(position) {
            lastPos = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                //altitude: position.coords.altitude,
                //accuracy: position.coords.accuracy,
                //altitude_Accuracy: position.coords.altitudeAccuracy,
                //heading: position.coords.heading,
                //speed: position.coords.speed,
                timestamp: position.timestamp
            };

            lastPos.title = uuid;
            lastPos.id = uuid;
            //$log.log('onSuccess current location', lastPos);
            publishItem(lastPos);


            /*
            $rootScope.$apply(function() {
                $rootScope.$broadcast('gis-location', lastPos);
            });
            */

            updateMarkers(lastPos);

            if (!addedFakeItems) {
                addedFakeItems = true;
                addFakeItems();
            }
        };

        function publishItem(item) {
            //$log.log('Publish', item);
            PubNub.ngPublish({
                channel: channelName,
                message: item
            });
        }

        function publishFakeItems() {
            $log.log('publishFakeItems', fakeItems);
            angular.forEach(fakeItems, function(item) {
                publishItem(item);
            });
        }

        var fakeItems = [];
        var addFakItem = function(pos, distance) {
            var uuid = Math.random().toString(10).substring(2,15);

            var item = {
                latitude: pos.latitude + Math.random() * distance - distance/2,
                longitude: pos.longitude + Math.random() * distance - distance/2,
                title: uuid+' (Fake)',
                id: uuid,
                fake: true
            };

            fakeItems.push(item);
        };

        var computeDistanceBetween = function(point1, point2) {
            var p1 = new google.maps.LatLng(point1.latitude, point1.longitude);
            var p2 = new google.maps.LatLng(point2.latitude, point2.longitude);
            return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        };

        var onError = function(error) {
            var err = {
                error_code: error.code,
                message: error.message
            };

            $log.error('GIS Error', err);
        };

        function getMarkers() {
            var markers = [];
            for (var key in friends) {
                if (friends.hasOwnProperty(key)) {
                    if (ConfigService.showFakeItem || !friends[key].fake) {
                        markers.push(friends[key]);
                    }
                }
            }
            return markers;
        }

        function updateMarkers(pos) {
            var changed = true;
            var newFriend = false;
            var isMe = pos.id == uuid;
            var isFake = pos.fake === true;

            if (!pos.id) {
                $log.error('Recived object without id', pos);
            }

            if (pos.id in friends) {
                var oldPos = friends[pos.id];
                if (oldPos.latitude == pos.latitude ||
                    oldPos.longitude == pos.longitude) {
                    changed = false;
                }
            }
            else {
                newFriend = true;
            }

            if (changed) {
                if (isFake) {
                    pos.icon = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
                }
                else if (!isMe) {
                    pos.icon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                }
                if (isMe) {
                    pos.description = 'My, Location: ' + pos.latitude.toFixed(4) + ', ' + pos.longitude.toFixed(4);
                }
                else {
                    pos.description = 'Distance: ' + computeDistanceBetween(lastPos, pos).toFixed(0) + 'meters';
                }

                friends[pos.id] = pos;
                $rootScope.$broadcast('gis-peer-location');
            }

            if (newFriend && !isMe) {
                var myFake = false;
                angular.forEach(fakeItems, function(item) {
                    myFake = myFake || item.id === pos.id;
                });

                if (!myFake) {
                    $log.log('Republish myself & fake, got new item id', pos.id);
                    publishItem(lastPos);
                    //And also republish the fake item if I created them
                    publishFakeItems();
                }
            }
        }

        var init = function() {
            $log.log('Gis Init', uuid);
            PubNub.init({
                publish_key: 'pub-c-7d9f3531-eb29-4da1-a030-734b93eb9bf9',
                subscribe_key: 'sub-c-46b73814-e64e-11e3-a931-02ee2ddab7fe',
                uuid: uuid});

            PubNub.ngSubscribe({ channel: channelName });

            $rootScope.$on(PubNub.ngMsgEv(channelName), function(event, payload) {
                //console.log('Incoming Data from', event, payload);
                //$log.log('Incoming GIS Info', payload.message.id, payload.message.timestamp, payload.message.latitude, payload.message.longitude);
                updateMarkers(payload.message);
            });

            $log.log('Gis: Get current position');
            var options = { maximumAge: 60000 * 30, timeout: 20000, enableHighAccuracy: true };
            navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
            var watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);

            /*
            var activeWatch = setInterval(function() {
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            }, queryLocationInterval);
            */
        };

        var getCenter = function() {
            return lastPos;
        };

        var addFakeItems = function() {
            $timeout(function () {
                var count = 0;
                if (friends) {
                    for (var key in friends) {
                        if (friends.hasOwnProperty(key)) {
                            marker = friends[key];
                            if (marker.fake) {
                                count += 1;
                            }
                        }
                    }


                    $log.log('Check add Fake Item', count);
                    if (count === 0) {
                        var pos = lastPos;
                        if (pos) {
                            $log.log('Add Fake Item');
                            addFakItem(pos, 0.006);
                            addFakItem(pos, 0.006);
                            addFakItem(pos, 0.008);
                            addFakItem(pos, 0.008);
                            publishFakeItems();
                        };
                    }
                }
            }, 5000 + Math.random() * 10000);
        };


        return {
            init: init,
            getCenter: getCenter,
            myPosition: lastPos,
            friends: friends,
            addFakItem: addFakItem,
            getMarkers: getMarkers
        }
    });

