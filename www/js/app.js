/*
 *  Copyright 2016 SanJose Solutions, Bangalore
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.

 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.

 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'mifosmobil' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'mifosmobil.services' is found in services.js
// 'mifosmobil.controllers' is found in controllers.js
angular.module('mifosmobil', ['ionic', 'mifosmobil.controllers', 'mifosmobil.services', 'mifosmobil.utilities', 'ngCordova','pascalprecht.translate'])
/* below lines are used by camera app but seem to prevent login
.config(function($compileProvider) {
  $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
} )
*/
.run(function($ionicPlatform, $rootScope, $state, $log) { // $rootScope, $state, $log
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
  // Fix : SubHeader for tabs template for Android
  $rootScope.$on('$stateChangeSuccess', function () {
    $log.log($state.current.name);
    var tabs = angular.element(document.querySelector(".tabs-top"));
    //Important!!!! Put the state name you want this script to run on.  
    //change 'tab.chats' to state you want run on
    if ($state.current.name == "tab.sacco-list") {
      tabs.addClass('subheader');
    }
    else if ($state.current.name == "tab.staff") {
      tabs.addClass('subheader');
    }
    else if ($state.current.name == "tab.clients") {
      tabs.addClass('subheader');
    }
    else {
      tabs.removeClass('subheader');
    }
  });
  //
})

.config(function($logProvider) {
  $logProvider.debugEnabled(false);
})

.config(function($ionicConfigProvider) {
  if(!ionic.Platform.isIOS()) { 
    $ionicConfigProvider.scrolling.jsScrolling(false);
  }
})

.config(function($stateProvider, $urlRouterProvider,$translateProvider) {

  if(localStorage.getItem('language') == null){
    $translateProvider.useStaticFilesLoader({
      prefix: 'locales/',
      suffix: '.json'
    })
    .registerAvailableLanguageKeys(['locale-en', 'locale-id', 'locale-es','locale-br','locale-cs','locale-fr','locale-hi','locale-ka','locale-km','locale-lo','locale-oc','locale-pl','locale-pt','locale-sv','locale-uk','locale-vi','locale-zh_CN'], {})
    .preferredLanguage('locale-en')
    .fallbackLanguage('locale-en')
    .useSanitizeValueStrategy('escapeParameters');
  }else{
    $translateProvider.useStaticFilesLoader({
      prefix: 'locales/',
      suffix: '.json'
    })
    .registerAvailableLanguageKeys(['locale-en', 'locale-id', 'locale-es','locale-br','locale-cs','locale-fr','locale-hi','locale-ka','locale-km','locale-lo','locale-oc','locale-pl','locale-pt','locale-sv','locale-uk','locale-vi','locale-zh_CN'], {})
    .preferredLanguage(localStorage.getItem('language'))
    .fallbackLanguage(localStorage.getItem('language'))
    .useSanitizeValueStrategy('escapeParameters');
  }
  
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
      'menuContent': {
        templateUrl: 'templates/tab-saccos.html',
        controller: 'SACCOListCtrl'
      }
    }
  } )
  .state('tab.sacco-view', {
    url: '/saccos/:saccoId',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-view.html',
        controller: 'SACCOViewCtrl'
      }
    }
  } )
  .state('tab.sacco-edit', {
    url: '/saccos/:saccoId/edit',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-edit.html',
        controller: 'SACCOEditCtrl'
      }
    }
  } )
  .state('tab.sacco-reg', {
    url: '/sacco-register',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-edit.html',
        controller: 'SACCORegCtrl'
      }
    }
  } )

  .state('tab.staff', {
    url: '/staff',
    views: {
      'menuContent': {
        templateUrl: 'templates/tab-staff.html',
        controller: 'StaffCtrl'
      }
    }
  })
  .state('tab.staff-detail', {
    url: '/staff/:staffId',
    views: {
      'menuContent': {
        templateUrl: 'templates/staff-details.html',
        controller: 'StaffDetailCtrl'
      }
    }
  } )

  .state('tab.clients', {
    url: '/clients',
    views: {
      'menuContent': {
        templateUrl: 'templates/tab-clients.html',
        controller: 'ClientsCtrl'
      }
    }
  })
  .state('tab.iclients', {
    url: '/clients/inactive',
    views: {
      'menuContent': {
        templateUrl: 'templates/tab-inactiveClients.html',
        controller: 'InactiveClientsCtrl'
      }
    }
  } )
  .state('tab.client-detail', {
    url: '/clients/:clientId',
    views: {
      'menuContent': {
        templateUrl: 'templates/client-detail.html',
        controller: 'ClientViewCtrl'
      }
    }
  })
  .state('tab.client-share', {
    url: '/share/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/share-view.html',
        controller: 'ShareViewCtrl'
      }
    }
  } )
  .state('tab.client-shares-buy', {
    url: '/clients/:id/shares-buy',
    views: {
      'menuContent': {
        templateUrl: 'templates/shares-buy.html',
        controller: 'SharesBuyCtrl'
      }
    }
  } )
  .state('tab.client-sav-new', {
    url: '/clients/:id/savings-apply',
    views: {
      'menuContent': {
        templateUrl: 'templates/saving-open.html',
        controller: 'SavingsAccCreateCtrl'
      }
    }
  } )
  .state('tab.client-documents', {
    url: '/clients/:id/docs',
    views: {
      'menuContent': {
        templateUrl: 'templates/documents.html',
        controller: 'DocumentCtrl'
      }
    }
  } )
  .state('tab.client-savings', {
    url: '/savingsAccount/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/savings-details.html',
        controller: 'SavingsAccountCtrl'
      }
    }
  } )
  .state('tab.client-sav-trans', {
    url: '/savingsAccount/:id/transactions',
    views: {
      'menuContent': {
        templateUrl: 'templates/savings-transactions-summary.html',
        controller: 'SATransCtrl'
      }
    }
  } )
  .state('tab.client-loan-new', {
    url: '/clients/:id/loan-apply',
    views: {
      'menuContent': {
        templateUrl: 'templates/loan-apply.html',
        controller: 'LoansAccCreateCtrl'
      }
    }
  } )
  .state('tab.client-loan', {
    url: '/loan/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/loan-details.html',
        controller: 'LoanAccountCtrl'
      }
    }
  } )
  .state('tab.client-loan-trans', {
    url: '/loan/:id/transactions',
    views: {
      'menuContent': {
        templateUrl: 'templates/loan-transactions-summary.html',
        controller: 'LoanTransCtrl'
      }
    }
  } )
  .state('tab.client-loan-sched', {
    url: '/loan/:id/schedule',
    views: {
      'menuContent': {
        templateUrl: 'templates/loan-sched.html',
        controller: 'LoanSchedCtrl'
      }
    }
  } )
  .state('tab.client-edit', {
    url: '/clients/:clientId/edit',
    views: {
      'menuContent': {
        templateUrl: 'templates/client-edit.html',
        controller: 'ClientEditCtrl'
      }
    }
  } )
  .state('tab.client-reg', {
    url: '/client-register',
    views: {
      'menuContent': {
        templateUrl: 'templates/client-edit.html',
        controller: 'ClientRegCtrl'
      }
    }
  } )
  .state('tab.client-next-of-kin', {
    url: '/clients/:clientId/next-of-kin',
    views: {
      'menuContent': {
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

  .state('tab.dashboard-logs', {
    url: '/dashboard/logs',
    views: {
      'menuContent': {
        templateUrl: 'templates/logs.html',
        controller: 'LogsCtrl'
      }
    }
  } )
  .state('logs', {
    url: '/logs',
    templateUrl: 'templates/logs.html',
    controller: 'LogsCtrl'
  } )

  .state('tab.dashboard-pending-savings', {
    url: '/dashboard/pending-savings',
    views: {
      'menuContent': {
        templateUrl: 'templates/savings-accounts.html',
        controller: 'PendingSavingsCtrl'
      }
    }
  } )

  .state('tab.dashboard-pending-loans', {
    url: '/dashboard/pending-loans',
    views: {
      'menuContent': {
        templateUrl: 'templates/loan-accounts.html',
        controller: 'PendingLoanCtrl'
      }
    }
  } )

  .state('tab.dasbboard-active-clients', {
    url: '/dashboard/active-clients',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-report.html',
        controller: 'ActiveClientsCtrl'
      }
    }
  } )

  .state('tab.dasbboard-borrowers', {
    url: '/dashboard/borrowers',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-report.html',
        controller: 'BorrowersCtrl'
      }
    }
  } )

  .state('tab.dashboard-total-savings', {
    url: '/dashboard/total-savings',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-report.html',
        controller: 'TotalSavingsCtrl'
      }
    }
  } )

  .state('tab.dashboard-savings-prods', {
    url: '/dashboard/savings-prods',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-one-report.html',
        controller: 'SavProdRptCtrl'
      }
    }
  } )

  .state('tab.dashboard-loan-outstanding', {
    url: '/dashboard/loan-outstanding',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-report.html',
        controller: 'LoanOutstandingCtrl'
      }
    }
  } )

  .state('tab.dashboard-due-collected', {
    url: '/dashboard/due-collected',
    views: {
      'menuContent': {
        templateUrl: 'templates/sacco-report.html',
        controller: 'DuevCollectedCtrl'
      }
    }
  } )

  .state('tab.dashboard-member-detail', {
    url: '/dashboard/member-detail',
    views: {
      'menuContent': {
        templateUrl: 'templates/rpt-member-detail.html',
        controller: 'RptMemDetailCtrl'
      }
    }
  } )

  .state('tab.dashboard-member-transactions', {
    url: '/dashboard/member-transactions',
    views: {
      'menuContent': {
        templateUrl: 'templates/rpt-member-detail.html',
        controller: 'RptMemTransCtrl'
      }
    }
  } )

  .state('tab.settings', {
    url: '/settings',
    views: {
      'menuContent': {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
      }
    }
  } )

  .state('tab.dashboard', {
    url: '/dashboard',
    views: {
      'menuContent': {
        templateUrl: 'templates/tab-dashboard.html',
        controller: 'DashboardCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

});
