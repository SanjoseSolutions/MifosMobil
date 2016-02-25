// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})


.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'AnonCtrl'
  } )

// setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabsCtrl'
  })
// Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash',
    views: {
      'tab-dash': {
        templateUrl: 'templates/sacco-edit.html',
        controller: 'DashCtrl'
      }
    }
  })
  .state('tab.sacco-list', {
    url: '/saccos',
    views: {
      'tab-saccos': {
        templateUrl: 'templates/tab-saccos.html',
        controller: 'SACCOListCtrl'
      }
    }
  } )
  .state('tab.sacco-view', {
    url: '/saccos/:saccoId',
    views: {
      'tab-saccos': {
        templateUrl: 'templates/sacco-view.html',
        controller: 'SACCOViewCtrl'
      }
    }
  } )
  .state('tab.sacco-edit', {
    url: '/saccos/:saccoId/edit',
    views: {
      'tab-saccos': {
        templateUrl: 'templates/sacco-edit.html',
        controller: 'SACCOEditCtrl'
      }
    }
  } )
  .state('tab.sacco-reg', {
    url: '/sacco-register',
    views: {
      'tab-saccos': {
        templateUrl: 'templates/sacco-edit.html',
        controller: 'SACCORegCtrl'
      }
    }
  } )

  .state('tab.staff', {
    url: '/staff',
    views: {
      'tab-staff': {
        templateUrl: 'templates/tab-staff.html',
        controller: 'StaffCtrl'
      }
    }
  })
  .state('tab.staff-detail', {
    url: '/staff/:staffId',
    views: {
      'tab-staff': {
        templateUrl: 'templates/staff-details.html',
        controller: 'StaffDetailCtrl'
      }
    }
  } )

  .state('tab.clients', {
    url: '/clients',
    views: {
      'tab-clients': {
        templateUrl: 'templates/tab-clients.html',
        controller: 'ClientsCtrl'
      }
    }
  })
  .state('tab.client-detail', {
    url: '/clients/:clientId',
    views: {
      'tab-clients': {
        templateUrl: 'templates/client-detail.html',
        controller: 'ClientDetailCtrl'
      }
    }
  })
  .state('tab.client-shares-buy', {
    url: '/clients/:id/shares-buy',
    views: {
      'tab-clients': {
        templateUrl: 'templates/shares-buy.html',
        controller: 'SharesBuyCtrl'
      }
    }
  } )
  .state('tab.client-sav-new', {
    url: '/clients/:id/savings-apply',
    views: {
      'tab-clients': {
        templateUrl: 'templates/saving-open.html',
        controller: 'SavingsAccCreateCtrl'
      }
    }
  } )
  .state('tab.client-savings', {
    url: '/savingsAccount/:id',
    views: {
      'tab-clients': {
        templateUrl: 'templates/savings-details.html',
        controller: 'SavingsAccountCtrl'
      }
    }
  } )
  .state('tab.client-sav-trans', {
    url: '/savingsAccount/:id/transactions',
    views: {
      'tab-clients': {
        templateUrl: 'templates/savings-transactions-summary.html',
        controller: 'SATransCtrl'
      }
    }
  } )
  .state('tab.client-loan-new', {
    url: '/clients/:id/loan-apply',
    views: {
      'tab-clients': {
        templateUrl: 'templates/loan-apply.html',
        controller: 'LoansAccCreateCtrl'
      }
    }
  } )
  .state('tab.client-loan', {
    url: '/loan/:id',
    views: {
      'tab-clients': {
        templateUrl: 'templates/loan-details.html',
        controller: 'LoanAccountCtrl'
      }
    }
  } )
  .state('tab.client-loan-trans', {
    url: '/loan/:id/transactions',
    views: {
      'tab-clients': {
        templateUrl: 'templates/loan-transactions-summary.html',
        controller: 'LoanTransCtrl'
      }
    }
  } )
  .state('tab.client-edit', {
    url: '/clients/:clientId/edit',
    views: {
      'tab-clients': {
        templateUrl: 'templates/client-edit.html',
        controller: 'ClientEditCtrl'
      }
    }
  } )
  .state('tab.client-reg', {
    url: '/client-register',
    views: {
      'tab-clients': {
        templateUrl: 'templates/client-edit.html',
        controller: 'ClientRegCtrl'
      }
    }
  } )
  .state('tab.client-next-of-kin', {
    url: '/clients/:clientId/next-of-kin',
    views: {
      'tab-clients': {
        templateUrl: 'templates/client-next-of-kin.html',
        controller: 'ClientNextOfKinCtrl'
      }
    }
  } )
  .state('tab.client-next-of-kin-edit', {
    url: '/clients/:clientId/next-of-kin-edit',
    views: {
      'tab-client-next-of-kin-edit': {
        templateUrl: 'templates/client-next-of-kin-edit.html',
        controller: 'ClientNextOfKinCtrlEdit'
      }
    }
  } )

  .state('tab.dashboard', {
    url: '/dashboard',
    views: {
      'tab-dashboard': {
        templateUrl: 'templates/tab-dashboard.html',
        controller: 'DashboardCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
