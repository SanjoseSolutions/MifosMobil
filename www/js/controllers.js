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
 *
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

.controller('MainCtrl', [ '$rootScope', '$scope', 'Session', '$cordovaNetwork', 'logger',
    function($rootScope, $scope, Session, $cordovaNetwork, logger) {
  $scope = {
    session: Session
  };
  logger.log("Is authenticated: " + $scope.session.isAuthenticated() );
} ] )

.controller('LogsCtrl', [ '$rootScope', '$scope', function($rootScope, $scope) {
  $scope.log = {
    messages: $rootScope.messages
  };
} ] )

// With the new view caching in Ionic, Controllers are only called
// when they are recreated or on app start, instead of every page change.
// To listen for when this page is active (for example, to refresh data),
// listen for the $ionicView.enter event:
//
//$scope.$on('$ionicView.enter', function(e) {
//});
.controller('AnonCtrl', function($scope, Session, $cordovaNetwork, $ionicPopup, $timeout, $state, logger) {
  $scope.cred = {};
  $scope.login = function(auth) {
    if (window.Connection && $cordovaNetwork.isOffline()) {
      $scope.message = {
        "type": "warn",
        "text": "No connection to Internet"
      };
      return;
    }
    logger.log("Anon scope Login called..");
    $scope.message = null;
    Session.login(auth, function(response) {
      logger.log("Login successful");
      $state.go('tab.dashboard');
    }, function(response) {
      logger.log("Login failed. Got:"+response.status);
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
              logger.log("Pressing Send button with an Empty Input");
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
      logger.log('Got Email ID: ' + '"' + res + '"');
    });

    $timeout(function() {
      logger.log('Automatically Closing the Popup');
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);

  };
})

.controller('TabsCtrl', function($scope, $rootScope, Session,
    Roles, Cache, $cordovaNetwork, authHttp, $ionicPopup) {

  $scope.session = Session.get();

  $rootScope.$on('$cordovaNetwork:offline', function(e, ns) {
    $rootScope.isOnline = false;
    $scope.session.takeOffline();
    $ionicPopup.alert( {
      title: "Going Offline",
      template: "k-Mayra is going offline"
    } );
  } );

  $rootScope.$on('$cordovaNetwork:online', function(e, ns) {
    $rootScope.isOnline = true;
    $scope.session.takeOnline();
    $rootScope.cmd_success = 0;
    $rootScope.msg = "";
    $rootScope.onlinePopup =
      $ionicPopup.confirm( {
        title: "Going online",
        template: "k-Mayra is going online..{{msg}}"
      } );
    authHttp.runCommands(function(n) {
      $rootScope.cmd_count = n;
      $rootScope.cmd_success = 0;
      $rootScope.msg += "<br />Command count: " + n;
    }, function(method, url, data, response) {
      $rootScope.msg += "<br />Command " + method + " to " + url + " with " + data.length +
        " bytes data SUCCESS";
      $rootScope.cmd_success++;
    }, function(method, url, data, response) {
      $rootScope.msg += "<br />Command " + method + " to " + url + " with " + data.length +
        " bytes data FAIL(" + response.status + ")";
    }, function() {
      $rootScope.msg += "<br />RESULT: {{cmd_success}} SUCCESS, {{cmd_count - cmd_success}} FAIL";
    } );
    setTimeout(function() {
      $rootScope.onlinePopup.close();
    }, 10000);

    // ToDo: add other synchronization code here

    Cache.updateLastSync();
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

.controller('SACCORegCtrl', function($scope, SACCO, Office, DataTables, FormHelper, HashUtil, logger) {
  $scope.data = {};
  SACCO.query_sacco_unions(function(data) {
    $scope.data.sunions = data;
    $scope.data.op = "Register";
  } );
  $scope.saveSacco = function(office, sacco) {
    var sfs = Office.saveFields;
    ofields = FormHelper.preSaveForm(Office, office, false);
    logger.log("SACCO data: " + JSON.stringify(ofields));
    Office.save(ofields, function(new_office) {
      $scope.message = {
        "type": "info",
        "text": "Successfully created SACCO #" + new_office.officeId
      };
      var odts = Office.dataTables();
      for(var i = 0; i < odts.length; ++i) {
        var fields = FormHelper.preSaveForm(SACCO_Fields, odts[i], false);
        DataTables.save(fields, new_office.officeId, client[cdts[i]], function(data) {
          logger.log("Saved datatables data: " + data);
        }, function(response) {
          logger.log("Accepted for offline: " + JSON.stringify(response));
        }, function(response) {
          logger.log("Failed to save datatables data: " + response.status);
        } );
      }
    }, function(office) {
      $scope.message = {
        "type": "info",
        "text": "Accepted SACCO create request (offline): temp id:" + office.id
      };
    }, function(response) {
      var errors = response.data.errors;
      var errmsg = errors ? errors.map(function(e) {
        return e.defaultUserMessage
      } ).join("\n") : "";
      $scope.message = {
        "type": "error",
        "text": "Failed to create SACCO. Got " + response.code
          + ": " + errmsg
      };
      logger.log("SACCO create failed: " + JSON.stringify(response));
    } );
  };
} )

.controller('SACCOEditCtrl', function($scope, $stateParams, Office,
    SACCO, DataTables, DateUtil, logger) {
  var officeId = $stateParams.saccoId;
  logger.log("SACCO Edit invoked: " + officeId);
  SACCO.query_sacco_unions(function(data) {
    $scope.data = {
      sunions: data,
      op: "Edit"
    };
  } );
  SACCO.get_full(officeId, function(sacco) {
    logger.log("SACCO:" + JSON.stringify(sacco));
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
            logger.log("SACCO Fields offline. " + JSON.stringify(fields));
          }, function(response) {
            msg = msg + ", SACCO_Fields save failed.";
            logger.log("SACCO FIELDS fail. " + JSON.stringify(response.data));
          } );
        } else {
          DataTables.save('SACCO_Fields', officeId, sacco, function(fields) {
            msg = msg + ", created SACCO_Fields.";
          }, function(fields) {
            logger.log("SACCO Fields offline. " + JSON.stringify(fields));
            msg = msg + ", SACCO_Fields submitted.";
          }, function(response) {
            msg = msg + ", SACCO_Fields save failed.";
            logger.log("SACCO Fields fail." + JSON.stringify(response.data));
          } );
        }
        $scope.message = {
          "type": "info",
          "text": msg
        };
      } );
    }, function(office) {
      $scope.message = {
        "type": "info",
        "text": "Edit SACCO #" + office.id + " request accepted"
      };
    }, function(response) {
      var errors = response.data.errors;
      var errmsg = errors ? errors.map(function(e) {
        return e.defaultUserMessage
      } ).join("\n") : "";
      logger.log("SACCO edit fail: " + errmsg);
      $scope.message = {
        "type": "error",
        "text": "Failed to create SACCO. Got " + response.code +
          ": " + errmsg
      };
    } );
  };
} )

.controller('SACCOListCtrl', function($scope, SACCO, logger) {
  logger.log("SACCOListCtrl called");
  SACCO.query(function(saccos) {
    logger.log("Got SACCOs: " + saccos.length);
    $scope.data = { "saccos": saccos };
  }, function(sunions) {
    logger.log("Got SACCO Unions: " + sunions.length);
  } );
} )

.controller('SACCOViewCtrl', function($scope, $stateParams, SACCO, DateUtil, DataTables, logger) {
  var saccoId = $stateParams.saccoId;
  logger.log("Sacco view ctrl invoked for " + saccoId);
  $scope.data = {};
  $scope.$on('$ionicView.enter', function(e) {
    SACCO.get_full(saccoId, function(sacco) {
      $scope.data = sacco;
    } );
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

.controller('StaffDetailCtrl', function($scope, $stateParams, Staff, DateUtil, logger) {
  logger.log("StaffDetailCtrl called");
  Staff.get($stateParams.staffId, function(staff) {
    logger.log("Joining date array: " + JSON.stringify(staff.joiningDate));
    staff.joiningDt = DateUtil.localDate(staff.joiningDate);
    staff.fullname = staff.firstname + " " + staff.lastname;
    logger.log("Joining date local: " + staff.joiningDt);
    $scope.staff = staff;
  } );
} )

.controller('ClientsCtrl', function($scope, Clients, ClientImages, Settings, SavingsAccounts, LoanAccounts, logger) {

  $scope.$on('$ionicView.enter', function(e) {
    SavingsAccounts.query(function(data) {
      var client_savings = new Object;
      for(var i = 0; i < data.length; ++i) {
        var clientId = data[i].clientId;
        logger.log("Client #" + clientId + " account [" + i + "]");
        var summary = data[i].summary;
        var balance = summary.accountBalance;
        var totalSavings = client_savings[clientId] || 0;
        client_savings[clientId] = totalSavings + balance;
      }
      $scope.clientSavings = client_savings;
    } );

    LoanAccounts.query(function(data) {
      var client_loans = new Object;
      logger.log("Got " + data.length + " loans");
      for(var i = 0; i < data.length; ++i) {
        var loan = data[i];
        var clientId = loan.clientId;
        var summary = loan.summary;
        logger.log("Loan summary: " + JSON.stringify(summary));
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
    Customers, ClientImages, DateUtil, DataTables, Codes, SACCO, logger, Camera) {
  var clientId = $stateParams.clientId;
  logger.log("Looking for client:"+clientId);
  $scope.client = {};
  $scope.getPhoto = function() {
    logger.log('Getting camera');
    Camera.getPicture( {
      quality: 75,
      targetWidth: 150,
      targetHeight: 150,
      destinationType: 0, //Camera.DestinationType.DATA_URL,
      encodingType: 0, //Camera.EncodingType.JPEG,
      saveToPhotoAlbum: false
    } ).then(function(imageData) {
      var b64ImageURI = "data:image/jpeg;base64," + imageData;
      $scope.client.face = b64ImageURI;
      ClientImages.save(clientId, b64ImageURI, function(result) {
        logger.log("Client image saved");
      }, function(response) {
        logger.log("Image accepted (offline)");
      }, function(response) {
        logger.log("Image save failed");
      } );
    }, function(err) {
      logger.log(err);
    } );
  };
  $scope.$on('$ionicView.enter', function(e) {
    Customers.get_full(clientId, function(client) {
      client["NumShares"] = parseInt(Math.random()*10);
      $scope.client = client;
      $scope.client.dateOfBirth = DateUtil.localDate(client.dateOfBirth);
      var gname = client.gender.name || "male";
      $scope.client.face = "img/placeholder-" + gname.toLowerCase() + ".jpg";
    } );
    setTimeout(function(e) {
      ClientImages.getB64(clientId, function(img_data) {
        $scope.client.face = img_data;
      } );
    }, 2000);
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
    logger.log("Total Savings: " + totalSavings);
    $scope.client.savingsAccounts = sacs;
    $scope.client.TotalSavings = totalSavings;
    var loanAccounts = accounts["loanAccounts"] || [];
    logger.log("Loan Accounts:" + JSON.stringify(loanAccounts));
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
    logger.log("Total Loans Bal: " + totalLoans);
    $scope.client.TotalLoans = totalLoans;
    $scope.client.loanAccounts = lacs;
  } );
})

.controller('SavingsAccCreateCtrl', function($scope, $stateParams, SavingsAccounts,
    SavingsProducts, $ionicPopup, $timeout, logger) {

  SavingsProducts.query(function(products) {
    logger.log("Got products: " + products.length);
    $scope.products = products;
  } );

  $scope.prodChanged = function() {
    logger.log("Product was changed");
  };

  $scope.savingCreate = function()  {
    // TO DO :
    // Check the parameters' list

    $scope.savings = {
      minRequiredOpeningBalance: 0
    }; 
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
            if (!$scope.savings) {
              e.preventDefault();
              //don't allow the user to close the popup if empty
            } else {
              var sav = $scope.savings;
              logger.log("Going to save account: " + JSON.stringify(sav));
              SavingsAccounts.save(sav, function(new_sav) {
                logger.log("Savings created!");
              }, function(sav) {
                logger.log("Savings accepted");
              }, function(response) {
                logger.log("Savings create failed");
              } );
            }
          }
        }
      ]
    });

    myPopup.then(function(res) {
      logger.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      logger.log("Popup TimeOut");
      myPopup.close();
    }, 15000);
  };

} )

.controller('SavingsAccountCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout, logger) {
  var id = $stateParams.id;
  logger.log("SavingsAccountsCtrl for " + id);
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
          logger.log("Calling deposit with id:"+id+" and params:"+JSON.stringify(params));
          SavingsAccounts.deposit(id, params, function(data) {
            logger.log("Deposit successful!");
            $scope.message = {
              type: 'info',
              text: 'Deposit successful!'
            };
          }, function(res) {
            $scope.message = {
              type: 'info',
              text: 'Deposit accepted..'
            };
          }, function(res) {
            $scope.message = {
              type: 'warn',
              text: 'Deposit failed'
            };
            logger.log("Depsoit fail ("+ res.status+"): " + JSON.stringify(res.data));
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
          logger.log("Calling withdraw with id:"+id+" and params:"+JSON.stringify(params));
          SavingsAccounts.withdraw(id, params, function(data) {
            logger.log("Withdrawal successful!");
            $scope.message = {
              type: 'info',
              text: 'Withdrawal successful!'
            };
          }, function(res) {
            $scope.message = {
              type: 'info',
              text: 'Withdraw accepted'
            };
          }, function(res) {
            $scope.message = {
              type: 'warn',
              text: 'Withdraw failed'
            };
            logger.log("Withdrawal fail ("+ res.status+"): " + JSON.stringify(res.data));
          } );
        }
      } ]
    } );
  };
} )

.controller('SATransCtrl', function($scope, $stateParams, SavingsAccounts, logger) {
  var id = $stateParams.id;
  logger.log("SATransCtrl called with: " + id);
  $scope.data = {id: id};
  SavingsAccounts.get(id, function(sac) {
    $scope.data.accountNo = sac.accountNo;
    $scope.data.transactions = sac.transactions;
  } );
} )

.controller('LoansAccCreateCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout, logger) {

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
      logger.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      logger.log("Popup TimeOut");
      myPopup.close(); //close the popup after 15 seconds for some reason
    }, 15000);

  };
} )

.controller('LoanAccountCtrl', function($scope, $stateParams, LoanAccounts, $ionicPopup, logger) {
  var id = $stateParams.id;
  logger.log("LoanAccountsCtrl for " + id);
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
          logger.log("Calling repayment with id:"+id+" and params:"+JSON.stringify(params));
          LoanAccounts.repay(id, params, function(data) {
            logger.log("Repayment successful!");
            $scope.message = {
              type: 'info',
              text: 'Repayment successful!'
            };
          }, function(res) {
            $scope.message = {
              type: 'info',
              text: 'Repayment accepted..'
            };
          }, function(res) {
            $scope.message = {
              type: 'warn',
              text: 'Repayment failed'
            };
            logger.log("Repayment fail ("+ res.status+"): " + JSON.stringify(res.data));
          } );
        }
      } ]
    } );
  };
} )

.controller('LoanTransCtrl', function($scope, $stateParams, LoanAccounts, logger) {
  var id = $stateParams.id;
  logger.log("LoanTransCtrl called with: " + id);
  $scope.data = {id: id};
  LoanAccounts.get(id, function(lac) {
    $scope.data.accountNo = lac.accountNo;
    $scope.data.transactions = lac.transactions;
  } );
} )

.controller('SharesBuyCtrl',
    function($scope, $stateParams, /* SavingsAccounts,  */
     $ionicPopup, $timeout, logger) {

  $scope.data = {
      price: 100,
      noOfShares: 0,
      amount: 0
  }

  $scope.sharesBuy = function()  {
    // TO DO :
    // Check the parameters' list

    $scope.data.amount = $scope.data.noOfShares * $scope.data.price;

    var myPopup = $ionicPopup.show({
      title: '<strong>Shares Buy</strong>',
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
        { text: '<b>Buy</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.noOfShares) {
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
      logger.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      logger.log("Popup TimeOut");
      myPopup.close();
    }, 15000);
  };

} )
//

.controller('ClientNextOfKinCtrl', function($scope, $stateParams, Customers, DateUtil, DataTables, logger) {
  var clientId = $stateParams.clientId;
  logger.log("ClientNextOfKinCtrl invoked for client #" + clientId);
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

.controller('ClientEditCtrl', function($scope, $stateParams, Customers, HashUtil,
      Clients, ClientImages, DateUtil, DataTables, Codes, FormHelper, SACCO, logger) {
  var clientId = $stateParams.clientId;
  logger.log("Looking to edit client:"+clientId);
  $scope.data = { "op": "Edit" };
  $scope.codes = {};
  $scope.$on('$ionicView.enter', function(e) {
    Codes.getValues("Gender", function(gcodes) {
      logger.log("Got gender codes: " + JSON.stringify(gcodes))
      $scope.codes.genders = gcodes;
    } );
    Codes.getValues("ClientClassification", function(ocodes) {
      logger.log("Got occupation codes: " + JSON.stringify(ocodes))
      $scope.codes.occupations = ocodes;
    } );
    Codes.getValues("Relationship", function(rcodes) {
      logger.log("Relationship codes count:"+rcodes.length);
      $scope.codes.Relationships = rcodes;
    } );
  } );
  Customers.get_full(clientId, function(client) {
    /*
    var rClient = FormHelper.prepareForm(Clients, client);
    logger.log("Got client: " + JSON.stringify(client));
    logger.log("rClient:" + JSON.stringify(rClient));
    $scope.client = rClient;
    */
    FormHelper.prepareForm(Clients, client);
    $scope.client = client;
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
    logger.log("AddressExtraFields Display: " + $scope.extraFields);
  };
  $scope.toggleNextOfKin = function() {
    $scope.nextOfKin = $scope.nextOfKin ? false : true;
    $scope.extraFields = ($scope.extraFields === true) ? false : false;
    logger.log("NextOfKin Display : " + $scope.nextOfKin);
  };
  // y

  $scope.saveClient = function(client) {
    var cfields = FormHelper.preSaveForm(Clients, client);
    logger.log("Going to save client: " + JSON.stringify(cfields));
    var cdts = Clients.dataTables();
    for(var i = 0; i < cdts.length; ++i) {
      var dt = cdts[i];
      DataTables.get_one(cdts[i], clientId, function(dtrow, dt) {
        client[dt] = client[dt] || {};
        HashUtil.copy(client[dt], {
          "locale": "en",
          "dateFormat": "yyyy-MM-dd"
        } );
        if (!dtrow) {
          DataTables.save(dt, clientId, client[dt], function(data) {
            logger.log("Added datatables data: " + JSON.stringify(data));
            $scope.message = {
              "type": "info",
              "text": "Added client #" + clientId + " " + dt + "."
            };
          }, function(response) {
            $scope.message = {
              "type": "info",
              "text": "Accepted add client #" + clientId + " " + dt + "."
            };
            logger.log("Accepted to add datatables data: " + JSON.stringify(response));
          }, function(response) {
            $scope.message = {
              "type": "warn",
              "text": "Failed to add client #" + clientId + " " + dt + "."
            };
            logger.log("Failed to add datatables data: " + response.status);
          } );
        } else {
          DataTables.update(dt, clientId, client[dt], function(data) {
            $scope.message = {
              "type": "info",
              "text": "Saved client #" + clientId + " " + dt + "."
            };
            logger.log("Saved datatables data: " + JSON.stringify(data));
          }, function(response) {
            $scope.message = {
              "type": "info",
              "text": "Accepted save client #" + clientId + " " + dt + "."
            };
            logger.log("Accepted datatables for save");
          }, function(response) {
            var errors = response.data.errors;
            var errmsg = errors ? errors.map(function(e) {
              return e.defaultUserMessage
            } ).join("\n") : "";
            $scope.message = {
              "type": "info",
              "text": "Failed to save client #" + clientId + " " + dt + ": " + errmsg
            };
            logger.log("Failed to save datatables data: " + response.status);
          } );
        }
      } );
    }
    Clients.update(clientId, cfields, function(eclient) {
      logger.log("Save client success");
      $scope.message = {
        "type": "info",
        "text": "Client with id #" + eclient.clientId + " saved"
      };
    }, function(data) {
      $scope.message = {
        "type": "info",
        "text": "Client edit request accepted: #" + data.id
      };
    }, function(response) {
      var errors = response.data.errors;
      var errmsg = errors ? errors.map(function(e) {
        return e.defaultUserMessage
      } ).join("\n") : "";
      $scope.message = {
        "type": "warn",
        "text": "Client save failed:" + errmsg
      };
    } );
  };
} )

.controller('ClientRegCtrl', function($scope, Clients, ClientImages, DateUtil, DataTables, Codes, SACCO, FormHelper, logger) {
  // x
  $scope.toggleExtraFields = function() {
    $scope.extraFields = $scope.extraFields ? false : true;
    $scope.nextOfKin = ($scope.nextOfKin === true) ? false : false;
    logger.log("AddressExtraFields Display: " + $scope.extraFields);
  };
  $scope.toggleNextOfKin = function() {
    $scope.nextOfKin = $scope.nextOfKin ? false : true;
    $scope.extraFields = ($scope.extraFields === true) ? false : false;
    logger.log("NextOfKin Display : " + $scope.nextOfKin);
  };
  // y

  logger.log("Looking to register client");
  $scope.data = { "op": "Register" };
  $scope.saveClient = function(client) {
    var cfields = FormHelper.preSaveForm(Clients, client, false);
    cfields["active"] = true;
    Clients.save(cfields, function(new_client) {
      logger.log("Client created:" + JSON.stringify(new_client));
      $scope.message = {
        "type": "info",
        "text": "Client created with id #" + new_client.clientId
      };
      var cdts = Clients.dataTables();
      for(var i = 0; i < cdts.length; ++i) {
        DataTables.save(cdts[i], new_client.clientId, client[cdts[i]], function(data) {
          logger.log("Saved datatables data: " + data);
        }, function(response) {
          logger.log("Accepted for offline: " + JSON.stringify(response));
        }, function(response) {
          logger.log("Failed to save datatables data: " + response.status);
        } );
      }
    }, function(new_client) {
      $scope.message = {
        "type": "info",
        "text": "Accepted Client create request (offline)"
      };
    }, function(response) {
      logger.warn("Client create fail(" + response.status + ") RESPONSE:"
        + JSON.stringify(response.data));
      var errors = response.data.errors;
      var errmsg = errors ? errors.map(function(e) {
        return e.defaultUserMessage
      } ).join("\n") : "";
      logger.warn("ERROR: " + errmsg);
      $scope.message = {
        "type": "error",
        "text": "Client creation failed with code:"+response.status+"\n"
          + errmsg
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
    logger.log("Relationship codes count:"+rcodes.length);
    $scope.codes.Relationships = rcodes;
  } );
  SACCO.query(function(saccos) {
    $scope.codes.offices = saccos;
  }, function(sus) {} );
} )

.controller('DashboardCtrl', function($scope, authHttp, baseUrl, Cache,
    Session, Customers, Staff, SACCO, HashUtil, $ionicPopup, logger) {

  var session = null;
  $scope.$on('$ionicView.enter', function(e) {
    if (null == session) {
      session = Session;
      var loginPopup = $ionicPopup.alert( {
        title: 'Logging In',
        template: '<p>.<br>\n' +
          '<img src="img/kmayra.png" width="188" height="60" title="k-Mayra" />' +
          '<p>Login successful! Welcome ' + session.username() + '</p>',
        scope: $scope
      } );
      var role = session.role;
      switch (role) {
        case "Admin":
          SACCO.query_full(function(data) {
            $scope.num_saccos = data.length;
          } );
        case "Management":
          Staff.query(function(staff) {
            $scope.num_staff = staff.length;
          } );
        case "Staff":
          Customers.query_full(function(clients) {
            $scope.num_clients = clients.length;
          } );
      }
      $scope.session = session;
    }
  } );
  /*
  var saccos = Cache.getObject('h_offices');
  $scope.nextSACCO = HashUtil.nextKey(saccos);
  var clients = Cache.getObject('h_clients');
  $scope.nextClient = HashUtil.nextKey(clients);
  */
  $scope.ConfirmLogOut = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: 'Confirm Logout',
      template: 'You will <strong>lose access to Cached Data</strong>' +
        ' if you Logout.\n Are you sure?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        // "logout()" Can be Called here
        logger.log('Logout Confirmed!');
        Session.logout();
      } else {
        logger.log('Logout Cancelled!');
      }
    });
  };
} )
;
