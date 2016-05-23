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
 *  - DashboardCtrl: Home(dashboard) tab in the App
 *  - TabsCtrl: Tabs for authenticated users
 *  - SACCOListCtrl: SACCO List Tab
 *  - SACCOViewCtrl: SACCO View controller
 *  - SACCOEditCtrl: SACCO Edit controller
 *  - StaffCtrl: Staff List
 *  - StaffDetailCtrl: Staff detail
 *  - ClientsCtrl: Client List Tab
 *  - ClientViewCtrl: Client Details
 *  - ClientNextOfKinCtrl: Client Next of Kin
 *  - ClientEditCtrl: Client Edit
 */

angular.module('mifosmobil.controllers', ['ngCordova', 'checklist-model'])

// To listen for when this page is active (for example, to refresh data),
// listen for the $ionicView.enter event: $scope.$on('$ionicView.enter', function(e) {
//});

.controller('MainCtrl', [ '$rootScope', '$scope', 'Session', '$cordovaNetwork',
    'logger', 'CommandQueue', '$state', function($rootScope, $scope, Session,
    $cordovaNetwork, logger, CommandQueue, $state) {

  $rootScope = {
    session: null
  };

} ] )

.controller('SettingsCtrl', function($scope, $stateParams, DataTables,$translate) {

  if(localStorage.getItem('language') == null){
    $scope.language = "locale-en";
  }else{
    $scope.language = localStorage.getItem('language');
  }
  
  $scope.languageChange = function(languageID){
    $translate.use(languageID)
    localStorage.setItem('language', languageID);
  }
} )

.controller('LogsCtrl', [ '$rootScope', '$scope', function($rootScope, $scope) {
  $scope.log = {
    messages: $rootScope.messages
  };
} ] )

.controller('AnonCtrl', function($rootScope, $scope, Session, $cordovaNetwork,
    $ionicHistory, $ionicPopup, $timeout, $state, Cache, logger) {

  $scope.cred = {};

  $scope.$on('$ionicView.enter', function(e) {
    $ionicHistory.clearHistory();
    $rootScope.session = Session.get();
    if (Session.isAuthenticated()) {
      $state.go('tab.dashboard');
    }
  } );

  $scope.login = function(auth) {
    logger.log("Anon scope Login called..");
    $scope.message = null;
    Session.login(auth, function(authinfo) {
      logger.log("Login successful");
      var loginPopup = $ionicPopup.alert( {
        title: 'Login Successful!',
        template: '<p>.<br>\n' +
          '<img src="img/kmayra.png" width="188" height="60" title="k-Mayra" />' +
          '<p><center><h4>Welcome <strong>' + auth.username + '</strong></h4></center></p>',
        scope: $scope
      } );
      $timeout(function() {
        loginPopup.close();
      }, 1000);
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

.controller('TabsCtrl', function($scope, $rootScope, Session, logger, Clients,
    Roles, Cache, $cordovaNetwork, authHttp, $ionicPopup, CommandQueue, $translate) {

  $rootScope.$on('$cordovaNetwork:offline', 
    function(e, ns) {
      //$rootScope.isOnline = false;
      //$scope.session.takeOffline();
      logger.log("Going offline");
    } );

    $scope.switchLanguage = function(key) {
      console.log("-----");
     $translate.use(key);
    }
  
  $rootScope.$on('$cordovaNetwork:online',
    function(e, ns) {
      //$rootScope.isOnline = true;
      //$scope.session.takeOnline();
      logger.log("Going back online.");
      authHttp.runCommands(function(n) {
        if (n == 0) return;
        var msg = "Starting to execute " + n + " commands";
        logger.log(msg);
        var stPopup = $ionicPopup.alert({
          title: "Syncing",
          template: msg,
          scope: $scope
        } );
      }, function() {
        logger("SUCCESS"); // + method + " " + url + " :: " + JSON.stringify(data));
      }, function() {
        logger("FAILURE"); //: " + method + " " + url + " : " + response.status + " :: " + JSON.stringify(data));
      }, function() {
        logger.log("All commands done!");
        var rptPopup = $ionicPopup.alert({
          title: 'Offline Commands',
          template: 'All commands are done!',
          scope: $scope
        } );
      }, Clients.fetch );
    } );

  $rootScope.$on('sessionExpired', function() {
    var notifyPopup = $ionicPopup.alert({
      title: 'Session expired',
      template: 'You will be logged out'
    } );
    notifyPopup.then(function() {
      Session.logout();
    } );
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

      //document.addEventListener('offline', 
  } );


  $scope.logout = function() {
    Session.logout();
  };
} )

.controller('SACCORegCtrl', function($scope, SACCO, Office, DataTables, Formatter, HashUtil,
    SACCO_Fields, logger) {
  $scope.data = {};
  SACCO.query_sacco_unions(function(data) {
    $scope.data.sunions = data;
    $scope.data.op = "Register";
  } );
  $scope.saveSacco = function(office) {
    $scope.btnDisabled = true;
    var sfs = Office.saveFields;
    var ofields = Formatter.preSaveForm(Office, office, false);
    logger.log("SACCO data: " + JSON.stringify(ofields));
    var dtn = "SACCO_Fields";
    var fields = Formatter.preSaveForm(SACCO_Fields, office[dtn], false);
    logger.log("DataTable " + dtn + " Fields: " + JSON.stringify(fields));
    Office.save(ofields, function(new_office) {
      var officeId = new_office.id;
      $scope.message = {
        "type": "info",
        "text": "Successfully created SACCO #" + officeId
      };
      DataTables.save(dtn, officeId, fields, function(data) {
        logger.log("Saved datatables data: " + data);
      }, function(response) {
        logger.log("Accepted for offline: " + JSON.stringify(response));
      }, function(response) {
        logger.log("Failed to save datatables(" + response.status + ") data: " + response.data);
      } );
    }, function(office) {
      var cid = office.cid;
      HashUtil.copy(fields, {
        'locale': 'en',
        'dateFormat': 'yyyy-MM-dd'
      } );
      DataTables.saveOffline("SACCO_Fields", office.id, fields, cid);
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

.controller('SACCOEditCtrl', [ '$scope', '$stateParams', 'Office', 'SACCO',
    'Formatter', 'DataTables', 'DateUtil', 'logger', 'SACCO_Fields',
  function($scope, $stateParams, Office,
    SACCO, Formatter, DataTables, DateUtil, logger, SACCO_Fields) {
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
    Formatter.prepareForm(Office, sacco);
    $scope.sacco = sacco;
  } );
  $scope.saveSacco = function(office) {
    $scope.btnDisabled = true;
    var ofields = Formatter.preSaveForm(Office, office);
    officeId = officeId || $stateParams.saccoId;
    logger.log("Attempting update office #" + officeId + " :: " + JSON.stringify(ofields));
    Office.update(officeId, ofields, function(eOffice) {
      var msg = "Successfully edited SACCO:"+officeId;
      var fld = "joiningDate";
      var sacco = Formatter.preSaveForm(SACCO_Fields, office.SACCO_Fields);
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
      var errmsg = response.data;
      logger.log("SACCO edit fail: " + errmsg);
      $scope.message = {
        "type": "error",
        "text": "Failed to edit SACCO. Got " + response.status +
          ": " + errmsg
      };
    } );
  };
} ] )

.controller('SACCOListCtrl', [ '$scope', 'SACCO', 'logger', 'Clients', 'Cache',
    function($scope, SACCO, logger, Clients, Cache) {

  $scope.$on('$ionicView.enter', function(e) {
    logger.log("SACCOListCtrl called");
    SACCO.set_member_counts();
    SACCO.query(function(saccos) {
      logger.log("Got SACCOs: " + saccos.length);
      $scope.data = { "saccos": saccos.reverse() };
    }, function(sunions) {
      logger.log("Got SACCO Unions: " + sunions.length);
    } );
  } );

  $scope.fetchNewSaccos = function() {
    SACCO.fetch_all(function(saccos) {
      $scope.data = { "saccos": saccos.reverse() };
      $scope.$broadcast('scroll.refreshComplete');
    }, function(sunions) {
      logger.log("Got SACCO Unions: " + sunions.length);
    } );
  };

} ] )

.controller('SACCOViewCtrl', function($scope, $stateParams, SACCO, DateUtil, DataTables, logger) {
  $scope.data = {};
  $scope.$on('$ionicView.enter', function(e) {
    var saccoId = $stateParams.saccoId;
    logger.log("Sacco view ctrl invoked for " + saccoId);
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

.controller('InactiveClientsCtrl', [ '$scope', 'Clients', function($scope, Clients) {
  $scope.$on('$ionicView.enter', function(e) {
    Clients.query_inactive(function(iClients) {
      $scope.clients = iClients;
    } );
  } );
} ] )

.controller('ClientsCtrl', function($scope, Clients, ClientImages, Settings,
    SavingsAccounts, LoanAccounts, logger, $ionicLoading, $ionicScrollDelegate) {

  $ionicLoading.show({template: 'Loading..'});
  setTimeout(function() {$ionicLoading.hide();},3000);

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
        if (summary != null) {
          logger.log("Loan summary: " + JSON.stringify(summary));
          var loanAmt = summary ? summary.totalOutstanding : null;
        }
        var totalOutstanding = client_loans[clientId] || 0;
        client_loans[clientId] = totalOutstanding + loanAmt;
      }
      $scope.clientOutstanding = client_loans;
      setTimeout(function() {$ionicLoading.hide();},1500);
    } );

    Clients.query(function(clients) {
      process_data(clients);
      $ionicLoading.hide();
    } );
  } );

  $scope.remove = function(client) {
    Clients.remove(client);
  };

  $scope.fetchNewClients = function() {
    Clients.fetch_all(function(clients) {
      process_data(clients);
      $scope.$broadcast('scroll.refreshComplete');
    } );
  };

  $scope.scrollBottom = function() {
    $ionicScrollDelegate.scrollBottom();
  };

  $scope.scrollTop = function() {
    $ionicScrollDelegate.scrollTop();
  };

  function process_data(clients) {
    for(var i = 0; i < clients.length; ++i) {
      if (Settings.showClientListFaces) {
        ClientImages.getB64(clients[i].id, function(img_data) {
          clients[i].face = img_data;
        } );
      } else {
        var g = clients[i].gender;
        var gname = g ? g.name : 'male';
        var glname = gname ? gname.toLowerCase() : 'male';
        clients[i].face = "img/placeholder-" + glname + ".jpg";
      }
    }
    $scope.clients = clients;
    return true;
  }

})

.controller('ClientViewCtrl', function($scope, $stateParams, Clients, $ionicPopup,
    Customers, ClientImages, DateUtil, DataTables, Codes, SACCO, logger, Camera, $cordovaPrinter,$ionicPopover) {
  var clientId = $stateParams.clientId;
  logger.log("Looking for client:"+clientId);
  $scope.client = {};

  //initialsze more options popover
  $ionicPopover.fromTemplateUrl('templates/client-more-options.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.openMoreOptions = popover;
  });

  $scope.financialSummary = false;
  $scope.showFinancialSummay = function(){
    $scope.financialSummary = !$scope.financialSummary;
  }
  
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
  
  $scope.approveClient = function(client) {
    var id = client.id;
    logger.log("Called Client approve for #" + id);
    var dt = new Date();
    Clients.activate(id, DateUtil.toISODateString(dt), function(response) {
      $scope.client.pending = false;
      $ionicPopup.alert( {
        title: "Success",
        template: "Succesfully approved client"
      } );
      logger.log("Succesfully approved client");
    } );
  };
  $scope.rejectClient = function(client) {
    var id = client.id;
    var dt = new Date();
    var reasonId = 38; // Unspecified
    var fields = {
      'rejectionDate': DateUtil.toISODateString(dt),
      'rejectionReasonId': reasonId
    };
    Clients.reject(id, fields, function(response) {
      $scope.client.pending = false;
      $ionicPopup.alert( {
        title: "Rejected",
        template: "Client #" + id + " rejected"
      } );
      logger.log("Client #" + id + " rejected");
    } );
  };
  $scope.$on('$ionicView.enter', function(e) {
    logger.log("ClientView called for #" + clientId);
    Customers.get_full(clientId, function(client) {
      if (clientId.match(/^T[0-9]+$/)) {
        Clients.preShow(client);
      }
      $scope.client = client;
      logger.log('Client status: ' + JSON.stringify(client['status']));
      $scope.client.pending = (client['status']['value'] == 'Pending');
      $scope.client.dateOfBirth = DateUtil.localDate(client.dateOfBirth);
      if (client.timeline) {
        $scope.client.createdOnDate = DateUtil.localDate(client.timeline.submittedOnDate);
      }
      var gname = client.gender.name || "male";
      $scope.client.face = "img/placeholder-" + gname.toLowerCase() + ".jpg";
      logger.log('Client Fields: ' + JSON.stringify(client.Client_Fields));
    } );
    Clients.get_accounts(clientId, 'savingsAccounts', function(savingsAccounts) {
      var sacs = savingsAccounts.map(function(sac) {
        return {
          "id": sac.id,
          "accountNo": sac.accountNo,
          "productName": sac.productName,
          "status": sac.status,
          "accountBalance": sac.accountBalance
        };
      } );
      var totalSavings = savingsAccounts.reduce(function(sum, account) {
        return sum + account.accountBalance;
      }, 0);
      logger.log("Total Savings: " + totalSavings);
      $scope.client.savingsAccounts = sacs;
      $scope.client.TotalSavings = totalSavings;
    } );
    Clients.get_accounts(clientId, 'loanAccounts', function(loanAccounts) {
      logger.log("Loan Accounts:" + JSON.stringify(loanAccounts));
      var lacs = loanAccounts.map(function(lac) {
        return {
          "id": lac.id,
          "accountNo": lac.accountNo,
          "productName": lac.productName,
          "status": lac.status,
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
    Clients.get_accounts(clientId, 'shareAccounts', function(shareAccounts) {
      logger.log('Share accounts: ' + JSON.stringify(shareAccounts));
      var shacs = shareAccounts.map(function(shac) {
        return {
          id: shac.id,
          accountNo: shac.accountNo,
          totalApprovedShares: shac.totalApprovedShares,
          productId: shac.productId,
          productName: shac.productName,
          status: shac.status
        };
      } );
      $scope.client.shareAccounts = shacs;
    } );
    setTimeout(function(e) {
      ClientImages.getB64(clientId, function(img_data) {
        $scope.client.face = img_data;
      } );
    }, 1000);
  } );

  // Print Client Detail
  $scope.print = function() {
    if($cordovaPrinter.isAvailable()) {
      var doc = document.getElementById('client-details');
      $cordovaPrinter.print(doc);
    } else {
      alert("Printing is not available on device");
    } 
  }

  $scope.uploadDoc = function (clientId) {
    fileChooser.open(function(uri) {

      var server = baseUrl + '/clients/'+ clientId + '/documents';
      var options = {};
      options.headers = {"Fineract-Platform-TenantId": Settings.tenant, "Authorization": $http.defaults.headers.common.Authorization};
      options.params = {"name":"test"}
      document.addEventListener('deviceready', function () {

        $cordovaFileTransfer.upload(server, uri, options)
          .then(function(result) {
            // Success!
            logger.log(result)
          }, function(err) {
            // Error
            logger.log(err)
          }, function (progress) {
            logger.log(progress);
            // constant progress updates
          });

      }, false);

    });
  }

})

.controller('DocumentCtrl', function($scope, $stateParams, logger, Documents, 
        $ionicModal, $cordovaFileTransfer, baseUrl, Settings, $http, $log) {

    $scope.docForm = {};
    var clientId = $stateParams.id;

    Documents.getDocsList(clientId).then(function(docs) {
      $scope.docs = docs;
    })

    $ionicModal.fromTemplateUrl('addDoc.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;
    });
    
    $scope.closeModal = function() {
      $scope.modal.hide();
    };

    $scope.downloadDoc = function(doc) {
        var server = baseUrl + '/clients/'+ clientId + '/documents/' + doc.id + '/attachment?tenantIdentifier=' + Settings.tenant;
        var path = cordova.file.externalRootDirectory + doc.name;
        var options = {};
        
        $log.log($http.defaults.headers.common.Authorization)

        options.headers = {"Fineract-Platform-TenantId": Settings.tenant, "Authorization": $http.defaults.headers.common.Authorization};

        document.addEventListener('deviceready', function () {

          $cordovaFileTransfer.download(server, path, options)
            .then(function(result) {
              // Success!
              $log.log(result);
              alert("Succesfully Downloaded");
              $scope.closeModal();
            }, function(err) {
              // Error
              $log.log(err);
              alert("Download failed");
            }, function (progress) {
              $log.log(progress);
              // constant progress updates
            });

        }, false);
    };

    $scope.removeDoc = function(){
      Documents.removeDoc(clientId, doc.id).then(function(result) {
        $log.log(result);
      })
    }

    $scope.uploadDoc = function() {   

      fileChooser.open(function(uri) {
        
        $log.log(uri);

        var server = baseUrl + '/clients/'+ clientId + '/documents';
        var options = {};
        
        options.headers = {"Fineract-Platform-TenantId": Settings.tenant, "Authorization": $http.defaults.headers.common.Authorization};
        options.params = $scope.docForm;

        document.addEventListener('deviceready', function () {

          $cordovaFileTransfer.upload(server, uri, options)
            .then(function(result) {
              // Success!
              $log.log(result);
              alert("Succesfully Upload");
              $scope.closeModal();
            }, function(err) {
              // Error
              $log.log(err);
              alert("Upload failed");
            }, function (progress) {
              $log.log(progress);
              // constant progress updates
            });

        }, false);

      });
    }
})

.controller('SavingsAccCreateCtrl', function($scope, $stateParams, SavingsAccounts, HashUtil, $state,
    SavingsProducts, $ionicPopup, $timeout, logger, $cordovaNetwork, Clients, SACCO, DateUtil) {

  var id = $stateParams.id;
 $scope.savings= {};

  $scope.init = function() {
    Clients.get($stateParams.id, function(client) {
      $scope.client = client;
    } );
    SACCO.get_staff($scope.client.officeId, function(staff) {
      logger.log("Staff for office: " + JSON.stringify(staff));
      $scope.fieldOfficerOptions = staff;
    } );
    SavingsProducts.query(function(products) {
      logger.log("Got products: " + products.length);
      $scope.prodHash = HashUtil.from_a(products);
      $scope.products = products;
    } );
  };

  $scope.prodChanged = function(productId) {
    if (!productId) return; // if null
    var product = $scope.prodHash[productId];
    $scope.product = product;
    logger.log("Product was changed");
    $scope.savings.productName = product.name;
    $scope.savings.minRequiredOpeningBalance = product.minRequiredOpeningBalance;
    if (!ionic.Platform.isWebView() && $cordovaNetwork.isOnline()) {
      SavingsAccounts.getClientSavingForm(product.id,id,function(data) {
        $scope.prefilledDataToSaveForm = data;
      } );
    }
  };

  $scope.savingCreate = function()  {
    var myPopup = $ionicPopup.show( {
      title: '<strong>Savings Account Application</strong>',
      /* This Url takes you to a script with the same ID Name in index.html */
      templateUrl: 'popup-template-html',
      scope: $scope, // null,
      buttons: [ {
        text: 'Cancel',
        type: 'button-default', //'button-clear',
        onTap: function(e) {
          // e.preventDefault() will stop the popup from closing when tapped.
          return "Popup Canceled"; // false;
        }
      },
      {
        text: '<b>Save</b>',
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.savings) {
            e.preventDefault();
            logger.log("Savings data unavailable");
            //don't allow the user to close the popup if empty
          } else {
            logger.log("Got savings data about to apply");
            $scope.savingAccount($scope.savings);
            return $scope.savings;
          }
        }
      } ]
    } );

    $scope.savingAccount = function(saving) {
      var product = $scope.product;
      var savingAccountData = {
        allowOverdraft: product.allowOverdraft,
        charges: product.charges, // nullable
        productId: saving.productId,
        fieldOfficerId: saving.fieldOfficerId,
        locale: "en",
        dateFormat: "yyyy-MM-dd", // prefer ISO
        submittedOnDate: DateUtil.toISODateString(saving.submittedOnDate),
        enforceMinRequiredBalance: product.enforceMinRequiredBalance,
        interestCompoundingPeriodType: product.interestCompoundingPeriodType.id,
        interestPostingPeriodType: product.interestPostingPeriodType.id,
        interestCalculationType: product.interestCalculationType.id,
        interestCalculationDaysInYearType: product.interestCalculationDaysInYearType.id,
        minRequiredOpeningBalance: product.minRequiredOpeningBalance,
        minRequiredBalance: saving.minRequiredOpeningBalance,
        clientId: $scope.client.id,
        withdrawalFeeForTransfers: product.withdrawalFeeForTransfers,
        withHoldTax: product.withHoldTax,
        nominalAnnualInterestRate: product.nominalAnnualInterestRate
      }; 
      logger.log("Going to save account: " + JSON.stringify(savingAccountData));
      SavingsAccounts.save(savingAccountData, function(new_sav) {
        logger.log("Savings created!");
        alert("Applied for savings account #" + new_sav.id +
          ". Currently pending approval and activation");
        $timeout(function() {
          $state.go('tab.client-savings', { 'id': new_sav.id } );
        }, 3000);
      }, function(new_sav) {
        logger.log("Savings accepted");
        alert("Savings application submitted offline." +
          " Pending sync, approval and activation");
      }, function(response) {
        logger.log("Savings application failed");
      } );
    };

    myPopup.then(function(res) {
      logger.log('Received : ' + '"' + res + '"');
      // Insert the appropriate Code here
      // to process the Received Data for Saving Account Creation
    });

    $timeout(function() {
      logger.log("Popup TimeOut");
      myPopup.close();
    }, 10000);
  };
} )

.controller('SavingsAccountCtrl', function($scope, $stateParams, SavingsAccounts,
    $ionicPopup, $timeout, logger, HashUtil, DateUtil) {
  var id = $stateParams.id;
  logger.log("SavingsAccountsCtrl for " + id);
  $scope.data = {id: id};
  $scope.init = function(sac) {
    $scope.data.accountNo = sac.accountNo;
    $scope.data.productName = sac.savingsProductName;
    if ('Active' != sac.status.value) {
      $scope.data['status'] = sac.status.value;
      $scope.data.interestRate = sac.nominalAnnualInterestRate;
      $scope.data.interestCompoundingPeriod = sac.interestCompoundingPeriodType.value;
      $scope.data.interestPostingPeriod = sac.interestPostingPeriodType.value;
      $scope.data.interestCalculation = sac.interestCalculationType.value;
    }
    var summary = sac.summary;
    $scope.data.accountBalance = summary ? summary.accountBalance : 0;
  };
  $scope.$on('$ionicView.enter', function(e) {
    SavingsAccounts.get(id, $scope.init);
  } );
  $scope.approveAccount = function() {
    var data = {
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    };
    var dt = new Date();
    dt = DateUtil.toISODateString(dt);
    var approveData = { approvedOnDate: dt };
    HashUtil.copy(approveData, data);
    var showFailedApprove = function() {
      $ionicPopup.alert( {
        title: "Failure",
        template: "Approval failed"
      } );
    };
    SavingsAccounts.approve(id, approveData, function(account) {
      var activateData = { activatedOnDate: dt };
      HashUtil.copy(activateData, data);
      SavingsAccounts.activate(id, activateData, function(account) {
        $scope.init(account);
        $scope.data.status = null;
        $ionicPopup.alert( {
          title: "Success",
          template: "Approved Account"
        } );
      }, function(response) {
        showFailedApprove();
      } );        
    }, function(response) {
      showFailedApprove();
    } );
  };
  $scope.rejectAccount = function() {
    SavingsAccounts.reject(id, function(response) {
      $ionicPopup.alert( {
        title: "Rejected",
        template: "Account Rejected"
      } );
    }, function(response) {
      $ionicPopup.alert( {
        title: "Failure",
        template: "Rejection failed"
      } );
    } );
  };
  var updateBalance = function(data) {
    var bal = data.runningBalance;
    logger.log("Running balance: " + bal);
    $scope.data.accountBalance = bal;
  };
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
            updateBalance(data);
            $scope.message = {
              type: 'info',
              text: 'Deposit successful!'
            };
          }, function(data) {
            updateBalance(data);
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
            updateBalance(data);
            $scope.message = {
              type: 'info',
              text: 'Withdrawal successful!'
            };
          }, function(data) {
            updateBalance(data);
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
    logger.log("GOT SAVINGS ACCOUNT: " + JSON.stringify(sac, null, 4));
    $scope.data.accountNo = sac.accountNo;
    $scope.data.transactions = sac.transactions;
  } );
} )

.controller('LoansAccCreateCtrl', function($scope, $stateParams, LoanAccounts,
    DateUtil, HashUtil, $cordovaNetwork, $state, $ionicPopup, $timeout, logger,
    Clients, SACCO, DataTables, Codes, LoanProducts) {

  var id = $stateParams.id;
  $scope.init = function() {
    Codes.getValues("Loan purpose", function(pcodes) {
      $scope.loanPurposes = pcodes;
    } );
    $scope.loan = {};
    Clients.get(id, function(client) {
      $scope.client = client;
      $scope.loan.memberName = client.displayName;
    } );
    Clients.get_accounts(id, 'savingsAccounts', function(savingsAccounts) {
      $scope.linkAccounts = savingsAccounts.filter(function(a) {
        return a.status.active;
      } ).map(function(a) {
        a.name = a.accountNo + ' (' + a.productName + ')';
        return a;
      } );
    } );
    SACCO.get_staff($scope.client.officeId, function(staff) {
      logger.log("Staff for office: " + JSON.stringify(staff));
      $scope.loanOfficerOptions = staff;
    } );
    LoanProducts.query(function(prods) {
      $scope.prodHash = HashUtil.from_a(prods);
      $scope.productList = prods;
    } );
  };

  $scope.prodChanged = function(prodId) {
    var prodHash = $scope.prodHash;
    //logger.log("Product Hash: " + JSON.stringify(prodHash,null,2));
    var prod = $scope.prodHash[prodId];
    $scope.productData = prod;
    $scope.loan.principalAmount = prod.principal;
    $scope.loan.loanTerm = prod.repaymentEvery;
    $scope.loan.repaymentsNo = prod.numberOfRepayments;
  };

  $scope.loanApply = function()  {
    // TO DO :
    // Check the parameters' list
    
    $scope.data = $scope.loan;
    var days= Date.parse($scope.loan.openingDate);
    var date = new Date($scope.loan.openingDate),
        mnth = ("0" + (date.getMonth()+1)).slice(-2),
        day  = ("0" + date.getDate()).slice(-2),
         year = ("0" + date.getYear()).slice(-2);
       $scope.SubmittedDate = day+"/"+mnth+"/"+year;
       
      var date = new Date($scope.loan.disbursemantDate),
        mnth = ("0" + (date.getMonth()+1)).slice(-2),
        day  = ("0" + date.getDate()).slice(-2),
         year = ("0" + date.getYear()).slice(-2);
       $scope.disbursemantDate = day+"/"+mnth+"/"+year;



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
              $scope.saveLoanApplication($scope.data);
              return $scope.data;
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
    }, 5000);

  };

  $scope.saveLoanApplication = function(data){
    var product = $scope.productData;
    var loan = $scope.loan;
      var loanData = {
        dateFormat : "dd/MM/yy",
        locale : "en",
        clientId : id,
        productId : $scope.loan.productId,
        principal: loan.principalAmount,
        loanOfficerId: loan.loanOfficerId,
        loanTermFrequency: loan.repaymentsNo,
        loanTermFrequencyType: product.repaymentFrequencyType.id,
        loanType: "individual",
        numberOfRepayments: loan.repaymentsNo,
        repaymentEvery: loan.loanTerm,
        repaymentFrequencyType: product.repaymentFrequencyType.id,
        interestRatePerPeriod: product.interestRatePerPeriod,
        amortizationType: product.amortizationType.id,
        interestType: product.interestType.id,
        interestCalculationPeriodType: product.interestCalculationPeriodType.id,
        transactionProcessingStrategyId: product.transactionProcessingStrategyId,
        expectedDisbursementDate: $scope.disbursemantDate,
        submittedOnDate: $scope.SubmittedDate,
        maxOutstandingLoanBalance:"35000",
        disbursementData:[]
      };
      var linkAccountId = $scope.loan.linkAccountId;
      if (linkAccountId) {
        loanData['linkAccountId'] = linkAccountId;
      }
    LoanAccounts.save(loanData, function(new_loan){
      $timeout(function() {
        $state.go('tab.client-loan', { 'id': new_loan.id } );
      }, 3000);
    },function(sav) {
      logger.log("Loan Applied");
      alert("Loan application submitted offline." +
          " Pending sync, approval and activation");
    }, function(response) {
      alert("Loan application failed");
      var errs = response.data.errors;
      logger.log("Loan Application failed:" + JSON.stringify(errs, null, 2));
    });
    DataTables.saveLoanAccountExtraFiled(data,id, function(data) {
      logger.log("Saved datatable " + dt + " data: " + JSON.stringify(data));
    }, function(response) {
      logger.log("Accepted for offline: " + JSON.stringify(response));
    }, function(response) {
      logger.log("Failed to save datatables(" + response.status + ") data: " + JSON.stringify(response.data));
    } );

  };

} )

.controller('LoanAccountCtrl', function($scope, $stateParams, LoanAccounts, $ionicPopup, logger,
    Clients, HashUtil, DateUtil, $location) {
  console.log("dsadasdasd===");
  var id = $stateParams.id;
  logger.log("LoanAccountsCtrl for " + id);
  $scope.data = {id: id};
  var update_loan = function(lac) {
    $scope.accountData = lac;
    $scope.data.expectedDisbursementDate = DateUtil.localDate(lac.timeline.expectedDisbursementDate);
    $scope.data.submittedOnDate = DateUtil.localDate(lac.timeline.submittedOnDate);
    $scope.data.accountNo = lac.accountNo;
    $scope.data.productName = lac.loanProductName;
    $scope.data.principal = lac.principal;
    $scope.data.status = lac.status;
    var summary = lac.summary;
    if (summary) {
      $scope.data.totalOutstanding = summary.totalOutstanding;
      $scope.data.totalRepayment = summary.totalRepayment;
    }
    var clientId = lac.clientId;
    Clients.get_accounts(clientId, 'loanAccounts', function(accounts) {
      $scope.data.activeAccounts = accounts.filter(function(a) {
        return a.status.active;
      } );
    } );
  };
  LoanAccounts.get(id, update_loan);
  $scope.viewTransactions = function(id){
    $location.path("/tab/loan/"+id+"/transactions");
  }

  $scope.approveAccount = function() {
    var data = {
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    };
    var dt = new Date();
    dt = DateUtil.toISODateString(dt);
    var approveData = { approvedOnDate: dt };
    HashUtil.copy(approveData, data);
    var showFailedApprove = function() {
      $ionicPopup.alert( {
        title: "Failure",
        template: "Approval failed"
      } );
    };
    LoanAccounts.approve(id, approveData, function(account) {
      $scope.data.status.pendingApproval = false;
      $scope.data.status.waitingForDisbursal = true;
      $ionicPopup.alert( {
        title: "Success",
        template: "Approved Account"
      } );
    }, function(response) {
      showFailedApprove();
    } );
  };
  $scope.rejectAccount = function() {
    var data = {
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    };
    data['rejectedOnDate'] = DateUtil.toISODateString(new Date());
    LoanAccounts.reject(id, data, function(response) {
      $scope.data.status.pendingApproval = false;
      $scope.data.status.value = "Rejected";
      $ionicPopup.alert( {
        title: "Rejected",
        template: "Account Rejected"
      } );
    }, function(response) {
      $ionicPopup.alert( {
        title: "Failure",
        template: "Rejection failed"
      } );
    } );
  };
  $scope.disburseLoan = function() {
    var data = {
      locale: 'en',
      dateFormat: 'yyyy-MM-dd'
    };
    var dt = new Date();
    dt = DateUtil.toISODateString(dt);
    data['actualDisbursementDate'] = dt;
    LoanAccounts.disburse(id, data, function(account) {
      $scope.data.status.active = true;
      $ionicPopup.alert( {
        title: 'Disbursed',
        template: 'Loan disbursed!'
      } );
    }, function(response) {
      $ionicPopup.alert( {
        title: 'Failure',
        template: 'Disbursal failed'
      } );
    } );
  };

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
        text: 'Repay',
        onTap: function(res) {
          var params = {
            transactionAmount: $scope.repayment.transAmount,
            transactionDate: DateUtil.toDateString($scope.repayment.transDate),
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
            update_loan(data);
          }, function(res) {
            $scope.data.totalRepayment += $scope.repayment.transAmount;
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

.controller('LoanSchedCtrl', function($scope, $stateParams, LoanAccounts, logger) {
  var id = $stateParams.id;
  logger.log("LoanSchedCtrl called with: " + id);
  $scope.data = {id: id};
  LoanAccounts.get(id, function(lac) {
    $scope.data.accountNo = lac.accountNo;
    var schedule = lac.repaymentSchedule;
    logger.log("Repayment schedule: " + JSON.stringify(schedule, null, 2));
    $scope.data.repaymentSchedule = schedule;
  } );
} )

.controller('ShareViewCtrl', function($scope, $stateParams, Shares) {

  Shares.get($stateParams.id, function(share) {
    $scope.data = {
      id: share.id,
      productName: share.productName,
      totalApprovedShares: share.totalApprovedShares,
      totalPendingForApprovalShares: share.totalPendingForApprovalShares,
      status: share.status,
      accountNo: share.accountNo
    };
  } );

  $scope.approveShare = function(id) {
  };

  $scope.rejectShare = function(id) {
  };
} )

.controller('SharesBuyCtrl', 
    function($scope, $stateParams, ShareProducts, Clients,
     $ionicPopup, $timeout, logger, Shares) {

  $scope.init = function() {
    $scope.data = {
      requestedShares: 0
    };
    var clientId = $stateParams.id;
    $scope.share = {
      clientId: clientId
    };
    logger.log("Client ID: " + clientId);
    Clients.get_accounts(clientId, "savingsAccounts", function(saccounts) {
      var i=0, n=saccounts.length;
      logger.log("Got total " + n + " savings accounts");
      var asaccounts = [];
      for(;i < n; i++) {
        sac = saccounts[i];
        logger.log("SAVINGS ACCOUNT STATUS: " + JSON.stringify(sac['status']));
        if (sac['status']['active']) {
          logger.log("FOUND ACTIVE SAVINGS ACCOUNT");
          asaccounts.push({
            id: sac['id'],
            accountNo: sac['accountNo']
          });
        }
      }
      logger.log("Got " + asaccounts.length + " active accounts");
      $scope.data.activeSavingsAccounts = asaccounts;
    } );
    ShareProducts.get_first(function(share_product) {
      //logger.log("Loaded product: " + JSON.stringify(share_product));
      $scope.product = share_product;
    } );
  };

  $scope.sharesBuy = function()  {
    var product = $scope.product;
    $scope.amount = ($scope.share.requestedShares||0) * $scope.share.unitPrice;
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
            if (!$scope.share.requestedShares) {
              e.preventDefault();
              //don't allow the user to close the popup if empty
            } else {
              // Returning a value will cause the promise to resolve with the given value.
              var share = $scope.share;
              share['locale'] = 'en';
              share['dateFormat'] = 'yyyy-MM-dd';
              var date = new Date();
              var dt = date.toISOString().substr(0,10);
              share['applicationDate'] = dt;
              share['submittedDate'] = dt;
              share['charges'] = []; // currently no charges
              share['productId'] = product.id;
              Shares.save(share, function(new_share) {
                alert("Share application success: " + new_share.resourceId + ". Pending approval.");
              }, function(response) {
                alert("Share application accepted (offline). Pending sync and approval");
              }, function(err) {
                alert("Failure share application");
              } );

              return true; // true;
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
    $scope.client.dateOfBirth = DateUtil.localDate(client.dateOfBirth);
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
      $state, Clients, ClientImages, Client_Fields, Client_NextOfKin, DateUtil,
      DataTables, Codes, Formatter, SACCO, logger) {

  $scope.clientMinRequiredAge=14;
  console.log("Client Min Age: " + $scope.clientMinRequiredAge);
  $scope.maxDOB = DateUtil.getPastDate($scope.clientMinRequiredAge);
  console.log("Max DOB: " + $scope.maxDOB);

  var clientId = $stateParams.clientId;
  logger.log("Looking to edit client:"+clientId);
  $scope.data = { "op": "Edit" };
  $scope.$on('$ionicView.enter', function(e) {
    Clients.get_codevalues(function(codes) {
      $scope.codes = codes;
      SACCO.query(function(saccos) {
        $scope.codes.offices = saccos;
      }, function(sus) {} );
    } );
    Customers.get_full(clientId, function(client) {
      logger.log("Going to call client #"+clientId+" edit prepareForm");
      Formatter.prepareForm(Clients, client);
      logger.log("Client to edit: " + JSON.stringify(client));
      $scope.client = client;
    }, false);
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
    $scope.btnDisabled = true;
    var cfields = Formatter.preSaveForm(Clients, client);
    logger.log("Going to save client: " + JSON.stringify(cfields));
    var cdts = Clients.dataTables();
    var i = 0, len = cdts.length;
    for(; i < len; ++i) {
      var dt = cdts[i];
      DataTables.get_one(dt, clientId, function(dtrow, dt) {
        var dfields;
        if ('Client_NextOfKin' == dt) {
          dfields = Formatter.preSaveForm(Client_NextOfKin, client[dt], true);
        } else if ('Client_Fields' == dt) {
          dfields = Formatter.preSaveForm(Client_Fields, client[dt], true);
          HashUtil.copy(dfields, {locale: 'en'});
        }
        if (clientId.match('T[0-9]\+$')) {
          var method = 'post';
          if (!HashUtil.isEmpty(dtrow)) {
            method = 'put';
          }
          var cid = client.cid;
          logger.log('OFFLINE PARTIAL Datatables ' + dt + ' ' + method + ' called');
          DataTables.saveOffline(dt, clientId, dfields, cid, method);
        } else if (!dtrow) {
          DataTables.save(dt, clientId, dfields, function(data) {
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
          DataTables.update(dt, clientId, dfields, function(data) {
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
            logger.log("Failed to save datatables(" + response.status + ") data: " + response.data);
          } );
        }
      } );
    }
    logger.log('Going to call client edit');
    Clients.update(clientId, cfields, function(eclient) {
      logger.log("Save client success");
      $scope.message = {
        "type": "info",
        "text": "Client with id #" + clientId + " saved"
      };
      setTimeout(function() {
        $state.go('tab.client-detail', { 'clientId': clientId } );
      }, 1500);
    }, function(eclient) {
      logger.log('Client offline edit invoked');
      $scope.message = {
        "type": "info",
        "text": "Client edit request accepted: #" + clientId
      };
      setTimeout(function() {
        $state.go('tab.client-detail', { 'clientId': clientId } );
      }, 1500);
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

.controller('ClientRegCtrl', [ '$scope', 'Clients', 'ClientImages', 'DateUtil', '$state',
  'HashUtil', 'DataTables', 'Codes', 'SACCO', 'Formatter', 'logger', 'Cache', 'Client_NextOfKin',
  'Client_Fields',
    function($scope, Clients, ClientImages, DateUtil, $state,
      HashUtil, DataTables, Codes, SACCO, Formatter, logger, Cache, Client_NextOfKin,
      Client_Fields) {

  $scope.maxDOB = DateUtil.getPastDate(14);
  console.log("\nMax DOB: " + $scope.maxDOB);
  
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

  logger.log("Looking to register client");
  $scope.data = { "op": "Register" };
  $scope.saveClient = function(client) {
    $scope.btnDisabled = true;
    var cfields = Formatter.preSaveForm(Clients, client, false);
    var rstat = $scope.rolestat;
    if (rstat.isManagement || rstat.isAdmin) {
      cfields["active"] = true;
    } else {
      cfields["active"] = false;
      var auth = Cache.getObject('auth');
      cfields["officeId"] = auth.officeId;
    }
    var cdts = Clients.dataTables();
    Clients.save(cfields, function(new_client) {
      logger.log("Client created:" + JSON.stringify(new_client));
      $scope.message = {
        "type": "info",
        "text": "Client created with id #" + new_client.id
      };
      var i = 0, len = cdts.length;
      for(; i < len; ++i) {
        var dt = cdts[i];
        if (!client || !client[dt])
          continue;
        var dfields = null;
        if ('Client_NextOfKin' == dt) {
          dfields = Formatter.preSaveForm(Client_NextOfKin, client[dt], false);
        } else if ('Client_Fields' == dt) {
          dfields = Formatter.preSaveForm(Client_Fields, client[dt], false);
          HashUtil.copy(dfields, {locale: 'en'});
        }
        DataTables.save(dt, new_client.id, dfields, function(data) {
          logger.log("Saved datatable " + dt + " data: " + JSON.stringify(data));
        }, function(response) {
          logger.log("Accepted for offline: " + JSON.stringify(response));
        }, function(response) {
          logger.log("Failed to save datatables(" + response.status + ") data: " + JSON.stringify(response.data));
        } );
      }
      setTimeout(function() {
        $state.go('tab.client-detail', { 'clientId': new_client.id } );
      }, 1500);
    }, function(new_client) {
      // offline client save
      var cid = new_client.cid;
      var i = 0, len = cdts.length;
      for(; i < len; ++i) {
        var dt = cdts[i];
        if (!client || !client[dt])
          continue;
        var dfields = null;
        if ('Client_NextOfKin' == dt) {
          dfields = Formatter.preSaveForm(Client_NextOfKin, client[dt], false);
        } else if ('Client_Fields' == dt) {
          dfields = Formatter.preSaveForm(Client_Fields, client[dt], false);
          HashUtil.copy(dfields, {locale: 'en'});
        }
        logger.log("Going to call DT.saveOffline");
        DataTables.saveOffline(dt, new_client.id, dfields, cid);
      }
      $scope.message = {
        "type": "info",
        "text": "Accepted Client create request (offline)"
      };
      setTimeout(function() {
        $state.go('tab.client-detail', { 'clientId': new_client.id } );
      }, 1500);
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
  Clients.get_codevalues(function(codes) {
    $scope.codes = codes;
  } );
  SACCO.query(function(saccos) {
    $scope.codes.offices = saccos;
  }, function(sus) {} );
} ] )

.controller('PendingSavingsCtrl', [ '$scope', 'SavingsAccounts', 'logger',
    function($scope, SavingsAccounts, logger) {

  SavingsAccounts.query_pending(function(pAccts) {
    $scope.accounts = pAccts;
  } );

} ] )

.controller('PendingLoanCtrl', [ '$scope', 'LoanAccounts', 'logger',
    function($scope, LoanAccounts, logger) {

  LoanAccounts.query_pending(function(pAccts) {
    $scope.accounts = pAccts;
  } );

} ] )

.controller('DashboardCtrl', [ '$rootScope', '$scope', 'authHttp', '$log', 'SavingsAccounts',
    'baseUrl', 'Cache', 'Session', 'Customers', 'Staff', 'SACCO', 'HashUtil',
    '$ionicLoading', '$ionicPopup', 'SavingsProducts', 'logger', 'Clients',
    'ShareProducts', 'LoanAccounts',
    function($rootScope, $scope, authHttp, $log, SavingsAccounts,
      baseUrl, Cache, Session, Customers, Staff, SACCO, HashUtil,
      $ionicLoading, $ionicPopup, SavingsProducts, logger, Clients, 
      ShareProducts, LoanAccounts) {

  var session = null;

  $scope.$on('$ionicView.enter', function(e) {
    $ionicLoading.show({template: 'Loading..'});
    if (null == session) {
      logger.log("Loading session..");
      session = Session.get();
      $rootScope.session = session;
    }
    if (!authHttp.getAuthHeader()) {
      if (!Session.reset()) {
        $log.info('Failed to reset session');
        $rootScope.$broadcast('resetSession');
      } else {
        $log.info('Dashboard controller reset session');
      }
    }
    ShareProducts.fetch_all(function(prods) {
      logger.log("Got share products: " + prods.totalFilteredRecords + " products");
      logger.log(JSON.stringify(prods.pageItems));
    } );
    SavingsProducts.fetch_all(function(prods) {
      logger.log("Got savings " + prods.length + " products");
    });
    SavingsAccounts.query(function(sacs) {
      sacs.forEach(function(sac) {
        SavingsAccounts.fetch(sac.id, function(ac){} );
      } );
    } );
    SavingsAccounts.query_pending(function(pendingSavingsAccounts) {
      $scope.pendingSavingsAccountsCount = pendingSavingsAccounts.length;
    } );
    LoanAccounts.query(function(accounts) {
      accounts.forEach(function(a) {
        LoanAccounts.fetch(a.id, function(ac){} );
      } );
    } );
    LoanAccounts.query_pending(function(pendingLoanAccounts) {
      logger.log("PENDING LOAN ACCOUNTS: " + pendingLoanAccounts.length);
      $scope.pendingLoanAccountsCount = pendingLoanAccounts.length;
    } );

    $scope.num_inactiveClients = 0;
    var role = Session.getRole();
    $scope.uname = Session.uname || Session.username();
    $scope.loginTime = Session.loggedInTime();
    $scope.role = role;
    // $log.info("Role is " + role);
    switch (role) {
      case "Admin":
        SACCO.query_full(function(data) {
          $log.info("Fetched SACCOs");
          $scope.num_saccos = data.length;
        } );
      case "Management":
        Staff.query(function(staff) {
          $scope.num_staff = staff.length;
        } );
      case "Staff":
        Customers.query_full(function(clients) {
          $log.info("Fetched " + clients.length + " Clients");
          var i = 0; n = clients.length;
          $scope.num_clients = n;
          setTimeout(function() {
            $ionicLoading.hide();
          }, 2000);
          for(; i < n; ++i) {
            var clientId = clients[i].id;
            Clients.get_all_accounts(clientId, function(accounts) {} );
          }
        } );
        Clients.query_inactive(function(iClients) {
          $scope.num_inactiveClients = iClients.length;
          $ionicLoading.hide();
        } );
    }
  } );

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
} ] )

.controller('ActiveClientsCtrl', function($scope, SACCO, Clients, logger, Cache) {

  SACCO.query(function(saccos) {
    $scope.data = {saccos: saccos, show_saccos: true};
  } );

  $scope.toggleSaccos = function() {
    $scope.data.show_saccos = !$scope.data.show_saccos;
  };

  $scope.generateChart = function() {
    var oHash = {};
    var sel_saccos = $scope.data.sel_saccos || [];
    var h_offices = Cache.getObject('h_offices');
    var sels = [];
    sel_saccos.forEach(function(s) {
      oHash[s] = true;
      sels.push(s, h_offices[s]);
    } );
    $scope.data.sels = sels;
    Clients.query(function(clients) {
      var series = {};
      var oNames = {};
      clients.forEach(function(c) {
        if (oHash[c.officeId] && c.active) {
          var g = c.gender;
          if (g && g.name) {
            series[g.name] = series[g.name] || {};
            series[g.name][c.officeName] = series[g.name][c.officeName] || 0;
            series[g.name][c.officeName]++;
          }
        }
      } );
      $scope.data.activeCount = series;
      var data = [];
      for(var gname in series) {
        var gs = series[gname];
        var values = [];
        for(var oname in gs) {
          values.push( {
            label: oname,
            value: gs[oname]
          } );
        }
        var datum = {
          key: gname,
          color: (data.length ? "#ffbb11" : "#0022bb"),
          values: values
        };
        data.push(datum);
      }
      $scope.data.show_saccos = false;
      //logger.log("Got data: " + JSON.stringify(data, null, 2));
      nv.addGraph(function() {
        var chart = nv.models.multiBarHorizontalChart()
          .x(function(d) { return d.label })
          .y(function(d) { return d.value })
          .height(300)
          .margin({top: 30, right: 20, bottom: 20, left: 140})
          .showValues(true)
          .showControls(false)
//          .tooltips(true)
//          .transitionDuration(350)
//          .showControls(true)
          ;

        chart.yAxis.tickFormat(d3.format(',.2f'));
//        chart.rotateLabels(-45);
        d3.select('#chart svg')
          .datum(data)
          .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
      } );
    } );
  };
} )
;
