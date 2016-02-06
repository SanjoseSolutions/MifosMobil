/*  MifosMobil Controller file
 *  Filename: www/js/controllers.js
 *  This file has all Controllers:
 *  - MainCtrl: common to entire app
 *  - AnonCtrl: Login page (for anonymous users)
 *  - TabsCtrl: Tabs for authenticated users
 *  - SACCOEditCtrl: SACCO Edit controller
 *  - SACCOListCtrl: 
 *  - SACCOViewCtrl: 
 *  - StaffCtrl: 
 *  - StaffDetailCtrl: 
 *  - ClientsCtrl: 
 *  - ClientDetailCtrl: 
 *  - ClientNextOfKinCtrl:
 *  - ClientEditCtrl: 
 *  - AccountCtrl: 
 */

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
    Session.login(auth, function(response) {
      console.log("Login failed. Got:"+response.status);
      var msg = "";
      if (401 == response.status) {
        msg = " Incorrect username/password";
      }
      $scope.message = {
        "type": "error",
        "text": "Login failed." + msg
      };
    } );
  }
} )

.controller('TabsCtrl', function($scope, Session) {
  $scope.session = Session.get();
} )

.controller('SACCORegCtrl', function($scope, SACCO) {
  console.log("SACCO Reg invoked");
  SACCO.query_sacco_unions(function(data) {
    $scope.data = {
      offices: data,
      op: "Register"
    };
  } );
} )

.controller('SACCOEditCtrl', function($scope, SACCO) {
  console.log("SACCO Edit invoked");
  SACCO.query_sacco_unions(function(data) {
    $scope.data = {
      offices: data,
      op: "Edit"
    };
  } );
} )

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

.controller('SACCOViewCtrl', function($scope, $stateParams, Office, DateFmt, DataTables) {
  var saccoId = $stateParams.saccoId;
  console.log("Sacco view ctrl invoked for " + saccoId);
  Office.get(saccoId, function(office) {
    console.log("Got SACCO" + JSON.stringify(office));
    office.openingDt = DateFmt.localDate(office.openingDate);
    $scope.data = { sacco: office };
  } );
  DataTables.get('SACCO_Fields', saccoId, function(sdata) {
    var sfields = sdata[0];
    for(var fld in sfields) {
      $scope.data.sacco[fld] = sfields[fld];
    }
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

.controller('ClientsCtrl', function($scope, Clients, ClientImages, Settings, SavingsAccounts, LoanAccounts) {

  SavingsAccounts.query(function(data) {
    var client_savings = new Object;
    for(var i = 0; i < data.length; ++i) {
      var clientId = data[i].clientId;
      console.log("Client #" + clientId + " account [" + i + "]");
      var summary = data[i].summary;
      var balance = summary.accountBalance;
      var totalSavings = client_savings[clientId] || 0;
      client_savings[clientId] = totalSavings + balance;
    }
    $scope.clientSavings = client_savings;
  } );

  LoanAccounts.query(function(data) {
    var client_loans = new Object;
    console.log("Got " + data.length + " loans");
    for(var i = 0; i < data.length; ++i) {
      var loan = data[i];
      var clientId = loan.clientId;
      var summary = loan.summary;
      console.log("Loan summary: " + JSON.stringify(summary));
      var loanAmt = summary.totalOutstanding;
      var totalOutstanding = client_loans[clientId] || 0;
      client_loans[clientId] = totalOutstanding + loanAmt;
    }
    $scope.clientOutstanding = client_loans;
  } );

  Clients.query(function(clients) {
    for(var i = 0; i < clients.length; ++i) {
      if (Settings.showClientListFaces) {
        ClientImages.getB64(clients[i].id, function(img_data) {
          clients[i].face = img_data;
        } );
      } else {
        clients[i].face = "img/placeholder-" + clients[i].gender.name.toLowerCase() + ".jpg";
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
  $scope.client = {};
  Clients.get($stateParams.clientId, function(client) {
    console.log("Got client:"+JSON.stringify(client));
    $scope.client = client;
    $scope.client.dob = DateFmt.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
  Clients.get_accounts(clientId, function(accounts) {
    var savingsAccounts = account["savingsAccounts"];
    var totalSavings = savingsAccount.reduce(function(sum, account) {
      return sum + account.accountBalance;
    }, 0);
    console.log("Total Savings: " + totalSavings);
    $scope.client.TotalSavings = totalSavings;
    var loanAccounts = accounts["loanAccounts"];
    var totalLoans = loanAccounts.reduce(function(sum, account) {
      return sum + account.loanBalance;
    } );
    console.log("Total Loans Bal: " + totalLoans);
    $scope.client.TotalLoans = totalLoans;
  } );
  ClientImages.getB64(clientId, function(img_data) {
    $scope.client.face = img_data;
  } );
  // ToDo client savings, loan summary needed
  DataTables.get('Client_Fields', clientId, function(cdata) {
    var cfields = cdata[0];
    for(var fld in cfields) {
      $scope.client[fld] = cfields[fld];
    }
  } );
  DataTables.get('Client_NextOfKin', clientId, function(cdata) {
    if (cdata.length == 0) {
      return;
    }
    var cfields = cdata[0];
    console.log("Next of kin data: " + JSON.stringify(cfields));
    $scope.nextOfKin = cfields;
  } );
})

.controller('ClientNextOfKinCtrl', function($scope, $stateParams, Clients, DateFmt, DataTables) {
  var clientId = $stateParams.clientId;
  console.log("ClientNextOfKinCtrl invoked");
  Clients.get(clientId, function(client) {
    $scope.client = client;
    $scope.client.dob = DateFmt.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
  DataTables.get('Client_NextOfKin', clientId, function(cdata) {
    if (cdata.length == 0) {
      console.log("No data in client next of kin");
    }
    var cfields = cdata[0];
    $scope.nextOfKin = cfields;
    var rCode = cfields.Relationship_cd_Relationship;
    cfields.Relationship = rCode;
    console.log("Client next of kin data: " + JSON.stringify(cfields));
  } );
} )

.controller('ClientNextOfKinEditCtrl', function($scope, $stateParams, DataTables) {
  var clientId = $stateParams.clientId;
  DataTables.get('Client_NextOfKin', clientId, function(cdata) {
    if (cdata.length > 0) {
      var cfields = cdata[0];
      $scope.nextOfKin = cfields;
    }
  } );
} )

.controller('ClientEditCtrl', function($scope, $stateParams, Clients, ClientImages, DateFmt, DataTables) {
  var clientId = $stateParams.clientId;
  console.log("Looking to edit client:"+clientId);
  $scope.data = { "op": "Edit" };
  Clients.get(clientId, function(client) {
    console.log("Got client: " + JSON.stringify(client));
    $scope.client = client;
    $scope.client.dob = DateFmt.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
  ClientImages.getB64(clientId, function(img_data) {
    $scope.client.face = img_data;
  } );
  DataTables.get('Client_Fields', clientId, function(cdata) {
    var cfields = cdata[0];
    for(var fld in cfields) {
      $scope.client[fld] = cfields[fld];
    }
  } );
  $scope.saveClient = function(client) {
    var cfields = new Object();
    var keys = ["firstname", "lastname", "mobileNo"];
    for(var i = 0; i < keys.length; ++i) {
      var fld = keys[i];
      cfields[fld] = client[fld];
    }
    console.log("Called saveClient: " + JSON.stringify(cfields));
    Clients.update(client.id, cfields, function(eclient) {
      console.log("Save client success");
    } );
  };
} )

.controller('ClientRegCtrl', function($scope, Clients, ClientImages, DateFmt, DataTables) {
  console.log("Looking to register client");
  $scope.data = { "op": "Register" };
  $scope.createClient = function(client) {
    Clients.save(client, function(new_client) {
      console.log("Client created:" + JSON.stringify(new_client));
    } );
  };
} )

.controller('AccountCtrl', function($scope, authHttp, baseUrl, Session) {
  console.log("AccountCtrl invoked");
  $scope.session = Session;
  $scope.logout = function() { Session.logout(); }
} )
;

