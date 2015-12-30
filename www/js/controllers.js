angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('StaffCtrl', function($scope, Staff) {
  $scope.staff = Staff.all();
  $scope.remove = function(staff) {
    Staff.remove(staff);
  };
} )

.controller('ClientsCtrl', function($scope, Clients) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.clients = Clients.all();
  $scope.remove = function(client) {
    Clients.remove(client);
  };
})

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients) {
  $scope.client = Clients.get($stateParams.clientId);
})

.controller('AccountCtrl', function($scope, $http, $state, baseUrl) {
  var uri = baseUrl + "/authentication";
  $scope.login = function(auth) {
    $http.post(uri, {
      username: auth.username,
      password: auth.password,
      tenantIdentifier: "default"
    } ).success(function(data) {
      authHttp.setAuthHeader(data['base64EncodedAuthenticationKey']);
      $state.go('tab.dash');
    } );
  };
});
