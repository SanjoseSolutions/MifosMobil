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
  $scope.session = Session.get();
} )

.controller('DashCtrl', function($scope) {
  console.log("DashCtrl invoked");
})

.controller('StaffCtrl', function($scope, Staff) {
  Staff.query(function(staff) {
    $scope.staff = staff;
  } );
  $scope.remove = function(staff) {
    Staff.remove(staff);
  };
} )

.controller('StaffDetailCtrl', function($scope, $stateParams, Staff, DateFmt) {
  console.log("StaffDetailCtrl called");
  Staff.get($stateParams.staffId, function(staff) {
    console.log("Joining date array: " + JSON.stringify(staff.joiningDate));
    staff.joiningDt = DateFmt.localDate(staff.joiningDate);
    console.log("Joining date local: " + staff.joiningDt);
    $scope.staff = staff;
  } );
} )

.controller('ClientsCtrl', function($scope, Clients, ClientImages, Settings) {
  Clients.query(function(clients) {
    for(var i = 0; i < clients.length; ++i) {
      if (Settings.showClientListFaces) {
        ClientImages.getB64(clients[i].id, function(img_data) {
          clients[i].face = img_data;
        } );
      } else {
        clients[i].face = "img/placeholder-" + clients[i].gender.name + ".jpg";
      }
    }
    $scope.clients = clients;
  } );
  $scope.remove = function(client) {
    Clients.remove(client);
  };
})

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients, ClientImages, DateFmt) {
  console.log("Looking for client:"+$stateParams.clientId);
  Clients.get($stateParams.clientId, function(client) {
    console.log("Got client:"+JSON.stringify(client));
    $scope.client = client;
    $scope.client.dob = DateFmt.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name + ".jpg"
  } );
  ClientImages.getB64($stateParams.clientId, function(img_data) {
    $scope.client.face = img_data;
  } );
})

.controller('AccountCtrl', function($scope, authHttp, baseUrl, Session) {
  console.log("AccountCtrl invoked");
  $scope.session = Session;
  $scope.logout = function() { Session.logout(); }
});
