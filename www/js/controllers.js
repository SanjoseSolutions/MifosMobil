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

  Clients.query(function(clients) {
    $scope.clients = clients;
  } );
  $scope.remove = function(client) {
    Clients.remove(client);
  };
})

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients) {
  Clients.get($stateParams.clientId, function(client) {
    $scope.client = client;
  } );
})

.controller('AccountCtrl', function($scope, $http, $state, authHttp, baseUrl) {
  $scope.cred = {};
  $scope.login = function(auth) {
    console.log("login attempted..");
    var uri = baseUrl + "/authentication";
    console.log("uri: " + uri);
    console.log("user: " + auth.username + ", passwd: " + auth.password);
    uri += "?username=" + auth.username + "&password=" + auth.password;
    authHttp.clearAuthHeader();
    $http.post(uri).then(function(response) {
      console.log("Login successful");
      console.log("Resp hdr: " + JSON.stringify(response));
      var data = response["data"];
      var b64key = data["base64EncodedAuthenticationKey"];
      localStorage.setItem("b64key", b64key);
      console.log("Resp key: " + b64key);
      authHttp.setAuthHeader(b64key);
      $state.go('tab.dash');
    } );
  };
});
