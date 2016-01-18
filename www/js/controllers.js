angular.module('starter.controllers', [])

.controller('MainCtrl', function($scope, Session) {
  console.log("MainCtrl invoked");
  $scope = {
    session: Session
  };
  console.log("Role: " + $scope.session.getRole());
  console.log("Is authenticated: " + $scope.session.isAuthenticated() );
} )

// With the new view caching in Ionic, Controllers are only called
// when they are recreated or on app start, instead of every page change.
// To listen for when this page is active (for example, to refresh data),
// listen for the $ionicView.enter event:
//
//$scope.$on('$ionicView.enter', function(e) {
//});
.controller('AnonCtrl', function($scope, Session) {
  $scope.cred = {};
  console.log("Anon Controller invoked");
  $scope.login = function(auth) {
    console.log("Anon scope Login called..");
    Session.login(auth);
  }
} )

.controller('TabsCtrl', function($scope, Session) {
  $scope.session = Session;
} )

.controller('DashCtrl', function($scope) {
  console.log("DashCtrl invoked");
  console.log("Role: " + $scope.session.getRole());
})

.controller('StaffCtrl', function($scope, Staff) {
  $scope.staff = Staff.query();
  $scope.remove = function(staff) {
    Staff.remove(staff);
  };
} )

.controller('ClientsCtrl', function($scope, Clients) {

  Clients.query(function(clients) {
    $scope.clients = clients;
  } );
  $scope.remove = function(client) {
    Clients.remove(client);
  };
})

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients) {
  $scope.client = Clients.get($stateParams.clientId);
})

.controller('AccountCtrl', function($scope, authHttp, baseUrl, Session) {
  console.log("AccountCtrl invoked");
  var username = Session.username();
  console.log("Username:"+username);
  $scope.session = { username: username };
  $scope.logout = function() { Session.logout(); }
});
