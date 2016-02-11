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

.controller('SACCORegCtrl', function($scope, SACCO, Office, DataTables) {
  console.log("SACCO Reg invoked");
  $scope.data = {};
  SACCO.query_sacco_unions(function(data) {
    $scope.data.offices = data;
    $scope.data.op = "Register";
  } );
  $scope.saveSacco = function(office, sacco) {
    var sfs = Office.saveFields;
    var ofields = new Object();
    for(var i = 0; i < sfs.length; ++i) {
      var fld = sfs[i];
      ofields[fld] = office[fld];
    }
    ofields.dateFormat = "yyyy-MM-dd";
    ofields.locale = "en";
    var df = Office.dateFields;
    for(var i = 0; i < df.length; ++i) {
      var fld = df[i];
      var val = ofields[fld];
      if (val != null) {
        val = val.toISOString().substring(0, 10);
        ofields[fld] = val;
      }
    }
    Office.save(ofields, function(new_office) {
      $scope.message = {
        "type": "info",
        "text": "Successfully created SACCO: " + new_office.id
      };
    }, function(response) {
      $scope.message = {
        "type": "error",
        "text": "Failed to create SACCO. Got " + response.code
      };
      console.log("SACCO create failed: " + JSON.stringify(response));
    } );
  };
} )

.controller('SACCOEditCtrl', function($scope, $stateParams, Office,
    SACCO, DataTables, DateUtil) {
  var officeId = $stateParams.saccoId;
  console.log("SACCO Edit invoked: " + officeId);
  SACCO.query_sacco_unions(function(data) {
    $scope.data = {
      offices: data,
      op: "Edit"
    };
  } );
  Office.get(officeId, function(office) {
    console.log("OFFICe:" + JSON.stringify(office));
    $scope.office = office;
    $scope.office["openingDate"] = new Date(DateUtil.isoDate(office["openingDate"]));
  } );
  DataTables.get('SACCO_Fields', officeId, function(sdata) {
    $scope.sdata = sdata;
    var sfields = sdata[0];
    if (sfields != null) {
      console.log("SACCO FIELDS:" + JSON.stringify(sfields));
      sfields["joiningDate"] = new Date(DateUtil.isoDate(sfields["joiningDate"]));
    }
    $scope.sacco = sfields || {};
  } );
  $scope.saveSacco = function(office, sacco) {
    var sfs = Office.saveFields;
    var ofields = new Object();
    for(var i = 0; i < sfs.length; ++i) {
      var fld = sfs[i];
      ofields[fld] = office[fld];
    }
    ofields.dateFormat = "yyyy-MM-dd";
    ofields.locale = "en";
    var fld = "openingDate";
    var val = ofields[fld];
    if (val != null) {
      val = val.toISOString().substring(0, 10);
      ofields[fld] = val;
    }
    Office.update(officeId, ofields, function(eOffice) {
      var msg = "Successfully edited SACCO:"+officeId;
      var fld = "joiningDate";
      var val = sacco[fld];
      if (val != null) {
        val = val.toISOString().substring(0, 10);
        sacco[fld] = val;
      }
      sacco.locale = "en";
      sacco.dateFormat = "yyyy-MM-dd";
      if ($scope.sdata.length) {
        DataTables.update('SACCO_Fields', officeId, sacco, function(fields) {
          msg = msg + ", SACCO_Fields.";
        }, function(response) {
          console.log("SACCO FIELDS fail. " + JSON.stringify(response.data));
        } );
      } else {
        DataTables.save('SACCO_Fields', officeId, sacco, function(fields) {
          msg = msg + ", created SACCO_Fileds.";
        }, function(response) {
          console.log("SACCO Fields fail." + JSON.stringify(response.data));
        } );
      }
      $scope.message = {
        "type": "info",
        "text": msg
      };
    }, function(response) {
      console.log("SACCO edit fail: " + JSON.stringify(response.data));
      $scope.message = {
        "type": "error",
        "text": "Failed to create SACCO. Got " + response.code
      };
    } );
  };
} )

.controller('SACCOListCtrl', function($scope, Office, Clients) {
  console.log("SACCOListCtrl called");
  Clients.query(function(clients) {} );
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

.controller('SACCOViewCtrl', function($scope, $stateParams, Office, DateUtil, DataTables) {
  var saccoId = $stateParams.saccoId;
  console.log("Sacco view ctrl invoked for " + saccoId);
  $scope.data = {};
  Office.get(saccoId, function(office) {
    console.log("Got SACCO" + JSON.stringify(office));
    office.openingDt = DateUtil.localDate(office.openingDate);
    $scope.data.office = office;
  } );
  DataTables.get('SACCO_Fields', saccoId, function(sdata) {
    var sfields = sdata[0];
    if (sfields != null) {
      sfields["joiningDt"] = DateUtil.localDate(sfields["joiningDate"]);
      $scope.data.sacco = sfields;
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

.controller('StaffDetailCtrl', function($scope, $stateParams, Staff, DateUtil) {
  console.log("StaffDetailCtrl called");
  Staff.get($stateParams.staffId, function(staff) {
    console.log("Joining date array: " + JSON.stringify(staff.joiningDate));
    staff.joiningDt = DateUtil.localDate(staff.joiningDate);
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

.controller('ClientDetailCtrl', function($scope, $stateParams, Clients, 
    ClientImages, DateUtil, DataTables, Codes, SACCO) {
  var clientId = $stateParams.clientId;
  console.log("Looking for client:"+clientId);
  $scope.client = {};
  Clients.get($stateParams.clientId, function(client) {
    console.log("Got client:"+JSON.stringify(client));
    client["NumShares"] = parseInt(Math.random()*10);
    $scope.client = client;
    $scope.client.dateOfBirth = DateUtil.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
  Clients.get_accounts(clientId, function(accounts) {
    var savingsAccounts = accounts["savingsAccounts"] || [];
    var totalSavings = savingsAccounts.reduce(function(sum, account) {
      return sum + account.accountBalance;
    }, 0);
    console.log("Total Savings: " + totalSavings);
    $scope.client.TotalSavings = totalSavings;
    var loanAccounts = accounts["loanAccounts"] || [];
    console.log("Loan Accounts:" + JSON.stringify(loanAccounts));
    var totalLoans = loanAccounts.reduce(function(sum, account) {
      return sum + account.loanBalance;
    }, 0);
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

.controller('ClientNextOfKinCtrl', function($scope, $stateParams, Clients, DateUtil, DataTables) {
  var clientId = $stateParams.clientId;
  console.log("ClientNextOfKinCtrl invoked");
  Clients.get(clientId, function(client) {
    $scope.client = client;
    $scope.client.dateOfBirth = DateUtil.isoDate(client.dateOfBirth);
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

.controller('ClientEditCtrl', function($scope, $stateParams,
      Clients, ClientImages, DateUtil, DataTables, Codes, FormHelper, SACCO) {
  var clientId = $stateParams.clientId;
  console.log("Looking to edit client:"+clientId);
  $scope.data = { "op": "Edit" };
  Clients.get(clientId, function(client) {
    var rClient = Clients.prepareForm(client);
    console.log("Got client: " + JSON.stringify(client));
    console.log("rClient:" + JSON.stringify(rClient));
    $scope.client = rClient;

    var df = Clients.dateFields();
    for(var i = 0; i < df.length; ++i) {
      var fld = df[i];
      $scope.client[fld] = new Date(DateUtil.isoDate(client[fld]));
    }
    DataTables.get('Client_Fields', clientId, function(cdata) {
      var cfields = cdata[0];
      for(var fld in cfields) {
        $scope.client[fld] = cfields[fld];
      }
    } );
  } );
  $scope.saveClient = function(client) {
    var cfields = new Object();
    var sf = Clients.saveFields();
    for(var i = 0; i < sf.length; ++i) {
      var fld = sf[i];
      var val = client[fld];
      if ('Object' === typeof(val)) {
        if (val["id"]) {
          val = val.id;
        } else {
          console.log("Client Hash field without id:"+fld);
          val = "";
        }
      }
      cfields[fld] = val;
    }
    console.log("Called saveClient: " + JSON.stringify(cfields));
    Clients.update(client.id, cfields, function(eclient) {
      console.log("Save client success");
    } );
  };
  var gcode = Codes.getId("Gender");
  $scope.codes = {};
  Codes.getValues(gcode, function(gcodes) {
    $scope.codes.genders = gcodes;
  } );
  var ocode = Codes.getId("ClientClassification");
  Codes.getValues(ocode, function(ocodes) {
    $scope.codes.occupations = ocodes;
  } );
  SACCO.query(function(saccos) {
    $scope.codes.offices = saccos;
  }, function(sus) {} );
} )

.controller('ClientRegCtrl', function($scope, Clients, ClientImages, DateUtil, DataTables, Codes, SACCO) {
  console.log("Looking to register client");
  $scope.data = { "op": "Register" };
  $scope.saveClient = function(client) {
    var keys = ["firstname", "lastname", "mobileNo"];
    var dateFields = [ "dateOfBirth" ];
    var cfields = new Object();
    var sf = Clients.saveFields();
    for(var i = 0; i < sf.length; ++i) {
      var fld = sf[i];
      var val = client[fld];
      console.log("Client " + fld + " ISA " + typeof(val));
      if ('Object' === typeof(val)) {
        if (val["id"]) {
          val = val.id;
        } else {
          console.log("Client Hash field without id:"+fld);
          val = "";
        }
        cfields[fld+"Id"] = val;
      } else {
        cfields[fld] = val;
      }
    }
    var df = Clients.dateFields();
    for(var i = 0; i < df.length; ++i) {
      var fld = df[i];
      var val = cfields[fld];
      if (val != null) {
        val = val.toISOString().substring(0, 10);
        cfields[fld] = val;
        console.log("Client date field " + fld + " = " + val);
      }
    }
    cfields["dateFormat"] = "yyyy-MM-dd";
    cfields["locale"] = "en";
    cfields["active"] = true;
    Clients.save(cfields, function(new_client) {
      console.log("Client created:" + JSON.stringify(new_client));
      $scope.message = {
        "type": "info",
        "text": "Client created with id #" + new_client.id
      };
    }, function(response) {
      $scope.message = {
        "type": "error",
        "text": "Client creation failed. Report issue to admin code:"+response.code
          + " . Possible cause " + JSON.stringify(response.data)
      };
    } );
  };
  var gcode = Codes.getId("Gender");
  $scope.codes = {};
  Codes.getValues(gcode, function(gcodes) {
    $scope.codes.genders = gcodes;
  } );
  var ocode = Codes.getId("ClientClassification");
  Codes.getValues(ocode, function(ocodes) {
    $scope.codes.occupations = ocodes;
  } );
  SACCO.query(function(saccos) {
    $scope.codes.offices = saccos;
  }, function(sus) {} );
} )

.controller('AccountCtrl', function($scope, authHttp, baseUrl, Session) {
  console.log("AccountCtrl invoked");
  $scope.session = Session;
  $scope.logout = function() { Session.logout(); }
} )
;

