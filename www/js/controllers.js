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
 *  - DashboardCtrl: 
 */

angular.module('starter.controllers', ['ngCordova'])

.controller('MainCtrl', [ '$rootScope', '$scope', 'Session', '$cordovaNetwork',
    function($rootScope, $scope, Session, $cordovaNetwork) {
  console.log("MainCtrl invoked");
  $scope = {
    session: Session
  };
  console.log("Is authenticated: " + $scope.session.isAuthenticated() );
} ] )

// With the new view caching in Ionic, Controllers are only called
// when they are recreated or on app start, instead of every page change.
// To listen for when this page is active (for example, to refresh data),
// listen for the $ionicView.enter event:
//
//$scope.$on('$ionicView.enter', function(e) {
//});
.controller('AnonCtrl', function($scope, Session, $cordovaNetwork) {
  $scope.cred = {};
  console.log("Anon Controller invoked");
  $scope.login = function(auth) {
    if (window.Connection && $cordovaNetwork.isOffline()) {
      $scope.message = {
        "type": "warn",
        "text": "No connection to Internet"
      };
      return;
    }
    console.log("Anon scope Login called..");
    $scope.message = null;
    Session.login(auth, function(response) {
      console.log("Login failed. Got:"+response.status);
      var msg = "";
      if (401 == response.status) {
        msg = " Incorrect username/password";
      } else {
        msg = "Received " + response.status
      }
      $scope.message = {
        "type": "error",
        "text": "Login failed." + msg
      };
    } );
  }
} )

.controller('TabsCtrl', function($scope, $rootScope, Session,
    Roles, $cordovaNetwork, authHttp) {

  $scope.session = Session.get();
  $rootScope.$on('$cordovaNetwork:offline', function(e, ns) {
    Session.takeOffline();
  } );

  $rootScope.$on('$cordovaNetwork:online', function(e, ns) {
    Session.takeOnline();
    authHttp.runCommands();
  } );

  $scope.$on('$ionicView.enter', function(e) {
    var rolestat = new Object();
    var roles = Roles.getRoles();
    console.log("Roles:" + roles.join(','));
    var role = roles[0];
    var roleList = Roles.roleList();
    var roleFound = false;
    rolestat = new Object();
    for(var i = 1; i < roleList.length; ++i) {
      if (role == roleList[i]) {
        roleFound = true;
      }
      var rFlag = "is" + roleList[i];
      rolestat[rFlag] = roleFound;
    }
    rolestat.showAccount = true;
    $scope.rolestat = rolestat;
  } );
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
    }, function(office) {
      $scope.message = {
        "type": "info",
        "text": "Accepted SACCO create request (offline)"
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
    }, function(data) {
      $scope.message = {
        "type": "info",
        "text": "SACCO Edit request accepted"
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

  $scope.$on('$ionicView.enter', function(e) {
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
          var gname = clients[i].gender.name;
          var glname = gname ? gname.toLowerCase() : 'male';
          clients[i].face = "img/placeholder-" + glname + ".jpg";
        }
      }
      $scope.clients = clients;
    } );
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
  Clients.get(clientId, function(client) {
    client["NumShares"] = parseInt(Math.random()*10);
    $scope.client = client;
    $scope.client.dateOfBirth = DateUtil.localDate(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
  Clients.get_accounts(clientId, function(accounts) {
    var savingsAccounts = accounts["savingsAccounts"] || [];
    var sacs = savingsAccounts.map(function(sac) {
      return {
        "id": sac.id,
        "accountNo": sac.accountNo,
        "productName": sac.productName,
        "accountBalance": sac.accountBalance
      };
    } );
    var totalSavings = savingsAccounts.reduce(function(sum, account) {
      return sum + account.accountBalance;
    }, 0);
    console.log("Total Savings: " + totalSavings);
    $scope.client.savingsAccounts = sacs;
    $scope.client.TotalSavings = totalSavings;
    var loanAccounts = accounts["loanAccounts"] || [];
    console.log("Loan Accounts:" + JSON.stringify(loanAccounts));
    var lacs = loanAccounts.map(function(lac) {
      return {
        "id": lac.id,
        "accountNo": lac.accountNo,
        "productName": lac.productName,
        "loanBalance": lac.loanBalance
      };
    } );
    var totalLoans = loanAccounts.reduce(function(sum, account) {
      return sum + account.loanBalance;
    }, 0);
    console.log("Total Loans Bal: " + totalLoans);
    $scope.client.TotalLoans = totalLoans;
    $scope.client.loanAccounts = lacs;
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

.controller('SavingsAccCreateCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout) {

  $scope.savingCreate = function()  {
    // TO DO :
    // Check the parameters' list
    // Insert the appropriate Code here
    // ------>

    // The Popup is called
    $scope.data = $scope.product;

    
    var myPopup = $ionicPopup.show({
      title: '<strong>Saving Account Creation</strong>',
      /*
      cssClass: '', // String, The custom CSS class name
      subTitle: 'Please use normal things', */
      /* This Url takes you to a script with the same ID Name in index.html */
      templateUrl: 'popup-template.html',
      scope: $scope, // null,
      buttons: [
        { text: 'Cancel',
          type: 'button-default', //'button-clear',
          onTap: function(e) {
            // e.preventDefault() will stop the popup from closing when tapped.
            return "Popup Canceled"; // false;
          }
        },
        { text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data) {
              //don't allow the user to close unless the user enters a 'wifi password'
              e.preventDefault();
            } else {
              // Returning a value will cause the promise to resolve with the given value.
              return $scope.data; // true;
            }
          }
        }
      ]
    });

    myPopup.then(function(res) {
      console.log('Got text:' + '"' + res + '"');
      console.log('Got text:' + '"' + res.fieldOfficer + '"');
      console.log('Got text:' + '"' + $scope.data.initialDeposit + '"');
      
    });

    $timeout(function() {
      console.log("Popup TimeOut");
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);
  
    // ------ ! -----
  };

} )


.controller('SavingsAccountCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout) {
  var id = $stateParams.id;
  console.log("SavingsAccountsCtrl for " + id);
  $scope.data = {id: id};
  SavingsAccounts.get(id, function(sac) {
    $scope.data.accountNo = sac.accountNo;
    $scope.data.productName = sac.savingsProductName;
    var summary = sac.summary;
    $scope.data.accountBalance = summary ? summary.accountBalance : 0;
  } );
  $scope.makeDeposit = function() {
    $scope.deposit = {};
    $ionicPopup.show( {
      title: 'Make a Deposit',
      template: '<input type="text" placeholder="Enter Amount" ng-model="deposit.transAmount">' +
        '<input type="date" placeholder="e.g dd/mm/yyyy" ng-model="deposit.transDate">',
      scope: $scope,
      buttons: [ {
        text: 'Cancel'
      }, {
        text: 'Deposit',
        onTap: function(res) {
          var params = {
            transactionAmount: $scope.deposit.transAmount,
            transactionDate: $scope.deposit.transDate.toISOString().substr(0, 10),
            locale: 'en',
            dateFormat: 'yyyy-MM-dd'
          };
          console.log("Calling deposit with id:"+id+" and params:"+JSON.stringify(params));
          SavingsAccounts.deposit(id, params, function(data) {
            console.log("Deposit successful!");
            $scope.message = {
              type: 'info',
              text: 'Deposit successful!'
            };
          }, function(res) {
            console.log("Depsoit fail ("+ res.status+"): " + JSON.stringify(res.data));
          } );
        }
      } ]
    } );
  };
  $scope.doWithdrawal = function() {
    $scope.withdrawal = {};
    $ionicPopup.show( {
      title: 'Make a Withdrawal',
      template: '<input type="text" placeholder="Enter Amount" ng-model="withdrawal.transAmount">' +
        '<input type="date" placeholder="e.g dd/mm/yyyy" ng-model="withdrawal.transDate">',
      scope: $scope,
      buttons: [ {
        text: 'Cancel'
      }, {
        text: 'Withdraw',
        onTap: function(res) {
          var params = {
            transactionAmount: $scope.withdrawal.transAmount,
            transactionDate: $scope.withdrawal.transDate.toISOString().substr(0, 10),
            locale: 'en',
            dateFormat: 'yyyy-MM-dd'
          };
          console.log("Calling withdraw with id:"+id+" and params:"+JSON.stringify(params));
          SavingsAccounts.withdraw(id, params, function(data) {
            console.log("Withdrawal successful!");
            $scope.message = {
              type: 'info',
              text: 'Withdrawal successful!'
            };
          }, function(res) {
            console.log("Withdrawal fail ("+ res.status+"): " + JSON.stringify(res.data));
          } );
        }
      } ]
    } );
  };
} )

.controller('SATransCtrl', function($scope, $stateParams, SavingsAccounts) {
  var id = $stateParams.id;
  console.log("SATransCtrl called with: " + id);
  $scope.data = {id: id};
  SavingsAccounts.get(id, function(sac) {
    $scope.data.accountNo = sac.accountNo;
    $scope.data.transactions = sac.transactions;
  } );
} )

.controller('LoansAccCreateCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout) {

  $scope.loanApply = function()  {
    // TO DO :
    // Check the parameters' list
    // Insert the appropriate Code here
    // ------>

    // The Popup is called
    $scope.data = $scope.product;

    
    var myPopup = $ionicPopup.show({
      title: '<strong>Loan Application</strong>',
      /*
      cssClass: '', // String, The custom CSS class name
      subTitle: 'Please use normal things', */
      /* This Url takes you to a script with the same ID Name in index.html */
      templateUrl: 'popup-template.html',
      scope: $scope, // null,
      buttons: [
        { text: 'Cancel',
          type: 'button-default', //'button-clear',
          onTap: function(e) {
            // e.preventDefault() will stop the popup from closing when tapped.
            return "Popup Canceled"; // false;
          }
        },
        { text: '<b>Save</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data) {
              //don't allow the user to close unless the user enters a 'wifi password'
              e.preventDefault();
            } else {
              // Returning a value will cause the promise to resolve with the given value.
              return $scope.data; // true;
            }
          }
        }
      ]
    });

    myPopup.then(function(res) {
      console.log('Got text:' + '"' + res + '"');
      console.log('Got text:' + '"' + res.fieldOfficer + '"');
      console.log('Got text:' + '"' + $scope.data.initialDeposit + '"');
      
    });

    $timeout(function() {
      console.log("Popup TimeOut");
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);
  
    // ------ ! -----
  };

} )

.controller('LoanAccountCtrl', function($scope, $stateParams, LoanAccounts) {
  var id = $stateParams.id;
  console.log("LoanAccountsCtrl for " + id);
  $scope.data = {id: id};
  LoanAccounts.get(id, function(lac) {
    $scope.data.accountNo = lac.accountNo;
    $scope.data.productName = lac.loanProductName;
    $scope.data.principal = lac.principal;
    var summary = lac.summary;
    if (summary) {
      $scope.data.totalOutstanding = summary.totalOutstanding;
      $scope.data.totalRepayment = summary.totalRepayment;
    }
  } );
} )

.controller('LoanTransCtrl', function($scope, $stateParams, LoanAccounts) {
  var id = $stateParams.id;
  console.log("LoanTransCtrl called with: " + id);
  $scope.data = {id: id};
  LoanAccounts.get(id, function(lac) {
    $scope.data.accountNo = lac.accountNo;
    $scope.data.transactions = lac.transactions;
  } );
} )

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
    var rClient = FormHelper.prepareForm(Clients, client);
    console.log("Got client: " + JSON.stringify(client));
    console.log("rClient:" + JSON.stringify(rClient));
    $scope.client = rClient;
    DataTables.get('Client_Fields', clientId, function(cdata) {
      var cfields = cdata[0];
      for(var fld in cfields) {
        $scope.client[fld] = cfields[fld];
      }
    } );
  } );

  $scope.toggleExtraFields = function() {
    $scope.extraFields = $scope.extraFields ? false : true;
    console.log("AddressExtraFields Display: " + $scope.extraFields);
  }
  $scope.toggleNextOfKin = function() {
    $scope.nextOfKin = $scope.nextOfKin ? false : true;
    console.log("NextOfKin Display : " + $scope.nextOfKin);
  }

  $scope.saveClient = function(client) {
    var cfields = FormHelper.preSaveForm(Clients, client);
    console.log("Going to save client: " + JSON.stringify(cfields));
    Clients.update(clientId, cfields, function(eclient) {
      console.log("Save client success");
      $scope.message = {
        "type": "info",
        "text": "Client with id #" + eclient.clientId + " saved"
      };
    }, function(data) {
      $scope.message = {
        "type": "info",
        "text": "Client edit request accepted"
      };
    }, function(response) {
      $scope.message = {
        "type": "warn",
        "text": "Client save failed"
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
    }, function(new_client) {
      $scope.message = {
        "type": "info",
        "text": "Accepted Client create request (offline)"
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

.controller('DashboardCtrl', function($scope, authHttp, baseUrl, Cache,
    Session, Staff, $ionicPopup) {
  console.log("DashboardCtrl invoked");
  var session = Session;
  var role = session.role;
  switch (role) {
    case "Admin":
      $scope.num_saccos = Cache.getObject('offices').length;
    case "Management":
      Staff.query(function(staff) {
        $scope.num_staff = staff.length;
        console.log("Staff length set:" +staff.length);
      } );
    case "Staff":
      $scope.num_clients = Cache.getObject('clients').length;
  }
  $scope.session = session;
  $scope.ConfirmLogOut = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Confirm Logout',
      template: 'You will <strong>lose access to Cached Data</strong>' +
        ' if you Logout.\n Are you sure?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        // "logout()" Can be Called here
        console.log('Logout Confirmed!');
        Session.logout();
      } else {
        console.log('Logout Cancelled!');
      }
    });
  };
} )
;
