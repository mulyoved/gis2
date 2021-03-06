'use strict';
// Ionic Starter App, v0.9.20

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('Gis2', ['ionic', 'Gis2.controllers', 'Gis2.services', 'pubnub.angular.service', 'google-maps', 'Gis2.GISService'])

.run(function($ionicPlatform, $log, Gis) {
  $ionicPlatform.ready(function() {
    //StatusBar.styleDefault();
      $log.log("Device: ", ionic.Platform.device(), ionic.Platform.isWebView());
      Gis.init();
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
      .state('self-test', {
          url: '/selftest',
          abstract: false,
          templateUrl: 'templates/tab-dash.html',
          controller: 'SelfTestCtrl'
      })


      // setup an abstract state for the tabs directive
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html'
    })

    // Each tab has its own nav history stack:

    .state('tab.friends', {
      url: '/friends',
      views: {
        'tab-friends': {
          templateUrl: 'templates/tab-friends.html',
          controller: 'FriendsCtrl'
        }
      }
    })

    .state('tab.account', {
      url: '/account',
      views: {
        'tab-account': {
          templateUrl: 'templates/tab-account.html',
          controller: 'AccountCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/friends');

})

.factory('ConfigService', function() {
    return {
        version: '0.0.0.1',
        showFakeItem: true
    }
});

