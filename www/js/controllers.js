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

.controller('DashCtrl', function($scope, Office) {
  console.log("DashCtrl invoked");
  Office.query(function(data) {
    var offices = [];
    for(var i = 0; i < data.length; ++i) {
      console.log("Got office: " + JSON.stringify(data[i]));
      if (data[i].parentId == 1) {
        offices.push( {
          "id": data[i].id,
          "name": data[i].name
        } );
      }
    }
    $scope.offices = offices;
  } );
})

.controller('SACCOListCtrl', function($scope, Office) {
  console.log("SACCOListCtrl called");
  Office.query(function(data) {
    var sus = [];
    var po = new Object();
    var saccos = [];
    for(var i = 0; i < data.length; ++i) {
      if (data[i].parentId == 1) {
        sus.push( {
          "id": data[i].id,
          "name": data[i].name
        } );
        po[data[i].id] = data[i].parentId;
      } else {
        var parentId = data[i].parentId;
        var gpId = po[parentId];
        if (gpId != null && gpId == 1) {
          saccos.push( {
            "id": data[i].id,
            "name": data[i].name
          } );
        }
      }
    }
    console.log("Got SACCOs: " + saccos.length + " SUs: " + sus.length);
    $scope.data = { "saccos": saccos };
  } );
} )

.controller('SACCOViewCtrl', function($scope, $stateParams, Office, DateFmt) {
  console.log("Sacco view ctrl invoked for " + $stateParams.saccoId);
  Office.get($stateParams.saccoId, function(office) {
    console.log("Got SACCO" + JSON.stringify(office));
    office.openingDt = DateFmt.localDate(office.openingDate);
    $scope.data = { sacco: office };
  } );
} )

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
    staff.fullname = staff.firstname + " " + staff.lastname;
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

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients, ClientImages, DateFmt, DataTables) {
  var clientId = $stateParams.clientId;
  console.log("Looking for client:"+clientId);
  Clients.get($stateParams.clientId, function(client) {
    console.log("Got client:"+JSON.stringify(client));
    $scope.client = client;
    $scope.client.dob = DateFmt.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name + ".jpg"
  } );
  ClientImages.getB64(clientId, function(img_data) {
    $scope.client.face = img_data;
  } );
  DataTables.get('Client_Fields', clientId, function(cdata) {
    var cfields = cdata[0];
    for(var fld in cfields) {
      $scope.client[fld] = cfields[fld]; // or $scope.client[fld] = cfields[fld]
    }
  } );
})

.controller('AccountCtrl', function($scope, authHttp, baseUrl, Session) {
  console.log("AccountCtrl invoked");
  $scope.session = Session;
  $scope.logout = function() { Session.logout(); }
});
