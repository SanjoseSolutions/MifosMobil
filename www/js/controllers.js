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
.controller('AnonCtrl', function($scope, Session, $cordovaNetwork, $ionicPopup, $timeout) {
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
        msg = "Received: " + response.status
      }
      $scope.message = {
        "type": "error",
        "text": "Login failed." + msg
      };
    } );
  };

  $scope.resetPass = function() {
    $scope.data = {};

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      title: 'Enter your k-Mayra email ID',
      template: '<input type="password" ng-model="data.email" placeholder=" Type it here ... ">',
      scope: $scope, // null,
      buttons: [
        { text: 'Cancel',
          type: 'button-default', //'button-clear',
          onTap: function(e) {
            // e.preventDefault() will stop the popup from closing when tapped.
            return "Popup Canceled by User"; // false;
          }
        },
        { text: '<b>Send</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.email) {
              console.log("Pressing Send button with an Empty Input");
              //don't allow the user to close unless the user enters a 'wifi password'
              e.preventDefault();
            } else {
              // Returning a value will cause the promise to resolve with the given value.
              return $scope.data.email; // true;
            }
          }
        }
      ]
    });
    
    myPopup.then(function(res) {
      /*  TODO :
        - Function to check for Valid Email
        - Send the Email to the Server for Password Reset
      */
      console.log('Got Email ID: ' + '"' + res + '"');
    });

    $timeout(function() {
      console.log('Automatically Closing the Popup');
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);

  };
})

.controller('TabsCtrl', function($scope, $rootScope, Session,
    Roles, $cordovaNetwork, authHttp) {

  $scope.session = Session.get();

  $rootScope.$on('$cordovaNetwork:offline', function(e, ns) {
    Session.takeOffline();
  } );

  $rootScope.$on('$cordovaNetwork:online', function(e, ns) {
    Session.takeOnline();
    authHttp.runCommands();
    // ToDo: add other synchronization code here
  } );

  $scope.$on('$ionicView.enter', function(e) {
    var rolestat = new Object();
    var roles = Roles.getRoles();
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
      sunions: data,
      op: "Edit"
    };
  } );
  SACCO.get_full(officeId, function(sacco) {
    console.log("SACCO:" + JSON.stringify(sacco));
    $scope.sacco = sacco;
  } );
  $scope.saveSacco = function(office) {
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
      var sacco = office.SACCO_Fields;
      var val = sacco[fld];
      if (val != null) {
        val = val.toISOString().substring(0, 10);
        sacco[fld] = val;
      }
      sacco.locale = "en";
      sacco.dateFormat = "yyyy-MM-dd";
      DataTables.get_one('SACCO_Fields', officeId, function(sfields, dt) {
        if (sfields) {
          DataTables.update('SACCO_Fields', officeId, sacco, function(fields) {
            msg = msg + ", SACCO_Fields.";
          }, function(fields) {
            msg = msg + ", SACCO_Fields.";
            console.log("SACCO Fields offline. " + JSON.stringify(fields));
          }, function(response) {
            msg = msg + ", SACCO_Fields save failed.";
            console.log("SACCO FIELDS fail. " + JSON.stringify(response.data));
          } );
        } else {
          DataTables.save('SACCO_Fields', officeId, sacco, function(fields) {
            msg = msg + ", created SACCO_Fields.";
          }, function(fields) {
            console.log("SACCO Fields offline. " + JSON.stringify(fields));
            msg = msg + ", SACCO_Fields submitted.";
          }, function(response) {
            msg = msg + ", SACCO_Fields save failed.";
            console.log("SACCO Fields fail." + JSON.stringify(response.data));
          } );
        }
        $scope.message = {
          "type": "info",
          "text": msg
        };
      } );
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

.controller('SACCOListCtrl', function($scope, SACCO) {
  console.log("SACCOListCtrl called");
  SACCO.query(function(saccos) {
    console.log("Got SACCOs: " + saccos.length);
    $scope.data = { "saccos": saccos };
  }, function(sunions) {
    console.log("Got SACCO Unions: " + sunions.length);
  } );
} )

.controller('SACCOViewCtrl', function($scope, $stateParams, SACCO, DateUtil, DataTables) {
  var saccoId = $stateParams.saccoId;
  console.log("Sacco view ctrl invoked for " + saccoId);
  $scope.data = {};
  SACCO.get_full(saccoId, function(sacco) {
    $scope.data = sacco;
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
    Customers, ClientImages, DateUtil, DataTables, Codes, SACCO) {
  var clientId = $stateParams.clientId;
  console.log("Looking for client:"+clientId);
  $scope.client = {};
  Customers.get_full(clientId, function(client) {
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
})

.controller('SavingsAccCreateCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout) {

  $scope.savingCreate = function()  {
    // TO DO :
    // Check the parameters' list

    $scope.data = $scope.XYZ; 
    var myPopup = $ionicPopup.show({
      title: '<strong>Saving Account Creation</strong>',
      /* This Url takes you to a script with the same ID Name in index.html */
      templateUrl: 'popup-template-html',
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
              e.preventDefault();
              //don't allow the user to close the popup if empty
            } else {
              // Returning a value will cause the promise to resolve with the given value.
              return $scope.data; // true;
            }
          }
        }
      ]
    });

    myPopup.then(function(res) {
      console.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      console.log("Popup TimeOut");
      myPopup.close();
    }, 15000);
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
    
    $scope.data = $scope.XYZ;
    var myPopup = $ionicPopup.show({
      title: '<strong>Loan Application</strong>',
      /* This Url takes you to a script with the same ID Name in index.html */
      templateUrl: 'popup-template-html',
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
              //don't allow the user to close unless the user enters a value
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
      console.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      console.log("Popup TimeOut");
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);

  };
} )

.controller('LoanAccountCtrl', function($scope, $stateParams, LoanAccounts, $ionicPopup) {
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
  $scope.makeRepayment = function() {
    $scope.repayment = {};
    $ionicPopup.show( {
      title: 'Make a Repayment',
      template: '<input type="text" placeholder="Enter Amount" ng-model="repayment.transAmount">' +
        '<input type="date" placeholder="e.g dd/mm/yyyy" ng-model="repayment.transDate">',
      scope: $scope,
      buttons: [ {
        text: 'Cancel'
      }, {
        text: 'Repayment',
        onTap: function(res) {
          var params = {
            transactionAmount: $scope.repayment.transAmount,
            transactionDate: $scope.repayment.transDate.toISOString().substr(0, 10),
            locale: 'en',
            dateFormat: 'yyyy-MM-dd'
          };
          console.log("Calling repayment with id:"+id+" and params:"+JSON.stringify(params));
          LoanAccounts.repayment(id, params, function(data) {
            console.log("Repayment successful!");
            $scope.message = {
              type: 'info',
              text: 'Repayment successful!'
            };
          }, function(res) {
            console.log("Repayment fail ("+ res.status+"): " + JSON.stringify(res.data));
          } );
        }
      } ]
    } );
  };
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

.controller('ClientNextOfKinCtrl', function($scope, $stateParams, Customers, DateUtil, DataTables) {
  var clientId = $stateParams.clientId;
  console.log("ClientNextOfKinCtrl invoked");
  Customers.get_full(clientId, function(client) {
    $scope.client = client;
    $scope.client.dateOfBirth = DateUtil.isoDateStr(client.dateOfBirth);
    $scope.client.face = "img/placeholder-" + client.gender.name.toLowerCase() + ".jpg";
  } );
} )

.controller('ClientNextOfKinEditCtrl', function($scope, $stateParams, DataTables) {
  var clientId = $stateParams.clientId;
  DataTables.get_one('Client_NextOfKin', clientId, function(cfields, dt) {
    $scope.nextOfKin = cfields;
  } );
} )

.controller('ClientEditCtrl', function($scope, $stateParams, Customers,
      Clients, ClientImages, DateUtil, DataTables, Codes, FormHelper, SACCO) {
  var clientId = $stateParams.clientId;
  console.log("Looking to edit client:"+clientId);
  $scope.data = { "op": "Edit" };
  $scope.codes = {};
  $scope.$on('$ionicView.enter', function(e) {
    Codes.getValues("Gender", function(gcodes) {
      console.log("Got gender codes: " + JSON.stringify(gcodes))
      $scope.codes.genders = gcodes;
    } );
    Codes.getValues("ClientClassification", function(ocodes) {
      console.log("Got occupation codes: " + JSON.stringify(ocodes))
      $scope.codes.occupations = ocodes;
    } );
    Codes.getValues("Relationship", function(rcodes) {
      console.log("Relationship codes count:"+rcodes.length);
      $scope.codes.Relationships = rcodes;
    } );
  } );
  Customers.get_full(clientId, function(client) {
    var rClient = FormHelper.prepareForm(Clients, client);
    console.log("Got client: " + JSON.stringify(client));
    console.log("rClient:" + JSON.stringify(rClient));
    $scope.client = rClient;
    SACCO.query(function(saccos) {
      if (!saccos.length) {
        saccos = [ {
          id: client.officeId,
          name: client.officeName
        } ];
      }
      $scope.codes.offices = saccos;
    }, function(sus) {} );
  } );

  // x
  $scope.toggleExtraFields = function() {
    $scope.extraFields = $scope.extraFields ? false : true;
    $scope.nextOfKin = ($scope.nextOfKin === true) ? false : false;
    console.log("AddressExtraFields Display: " + $scope.extraFields);
  };
  $scope.toggleNextOfKin = function() {
    $scope.nextOfKin = $scope.nextOfKin ? false : true;
    $scope.extraFields = ($scope.extraFields === true) ? false : false;
    console.log("NextOfKin Display : " + $scope.nextOfKin);
  };
  // y

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
    var cdts = Clients.dataTables();
    for(var i = 0; i < cdts.length; ++i) {
      var dt = cdts[i];
      console.log("Got DATATABLE:" + dt);
      DataTables.get_one(cdts[i], clientId, function(dtrow, dt) {
        if (!dtrow) {
          DataTables.save(dt, clientId, client[dt], function(data) {
            console.log("Added datatables data: " + JSON.stringify(data));
          }, function(response) {
            console.log("Failed to add datatables data: " + response.status);
          } );
        } else {
          DataTables.update(dt, clientId, client[dt], function(data) {
            console.log("Saved datatables data: " + JSON.stringify(data));
          }, function(response) {
            console.log("Failed to save datatables data: " + response.status);
          } );
        }
      } );
    }
  };
} )

.controller('ClientRegCtrl', function($scope, Clients, ClientImages, DateUtil, DataTables, Codes, SACCO) {
  // x
  $scope.toggleExtraFields = function() {
    $scope.extraFields = $scope.extraFields ? false : true;
    $scope.nextOfKin = ($scope.nextOfKin === true) ? false : false;
    console.log("AddressExtraFields Display: " + $scope.extraFields);
  };
  $scope.toggleNextOfKin = function() {
    $scope.nextOfKin = $scope.nextOfKin ? false : true;
    $scope.extraFields = ($scope.extraFields === true) ? false : false;
    console.log("NextOfKin Display : " + $scope.nextOfKin);
  };
  // y

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
      var cdts = Clients.dataTables();
      for(var i = 0; i < cdts.length; ++i) {
        DataTables.save(cdts[i], new_client.id, client[cdts[i]], function(data) {
          console.log("Saved datatables data: " + data);
        }, function(response) {
          console.log("Failed to save datatables data: " + response.status);
        } );
      }
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
  $scope.codes = {};
  Codes.getValues("Gender", function(gcodes) {
    $scope.codes.genders = gcodes;
  } );
  Codes.getValues("ClientClassification", function(ocodes) {
    $scope.codes.occupations = ocodes;
  } );
  Codes.getValues("Relationship", function(rcodes) {
    console.log("Relationship codes count:"+rcodes.length);
    $scope.codes.Relationships = rcodes;
  } );
  SACCO.query(function(saccos) {
    $scope.codes.offices = saccos;
  }, function(sus) {} );
} )

.controller('DashboardCtrl', function($scope, authHttp, baseUrl, Cache,
    Session, Customers, Staff, SACCO, HashUtil, $ionicPopup) {
  console.log("DashboardCtrl invoked");
  var session = Session;
  var role = session.role;
  switch (role) {
    case "Admin":
      SACCO.query_full(function(data) {
        $scope.num_saccos = data.length;
      } );
    case "Management":
      Staff.query(function(staff) {
        $scope.num_staff = staff.length;
        console.log("Staff length set:" +staff.length);
      } );
    case "Staff":
      Customers.query_full(function(clients) {
        $scope.num_clients = clients.length;
      } );
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
