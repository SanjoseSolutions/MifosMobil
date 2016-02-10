/*  This is the services script - contains key app services
 *  Current services available (this should be kept up-to-date)
 *    1. baseUrl: the base URL of Mifos X backend
 *    2. authHttp: HTTP + Authentication (wraps around http)
 *    3. Session: login, logout, username, authinfo
 *    3. resources: Clients, Staff
 */

angular.module('starter.services', [])

.factory('Settings', function() {
  return {
    'baseUrl': 'https://kifiya.openmf.org/mifosng-provider/api/v1',
    'tenant': 'kifiya',
    'showClientListFaces': false
  };
} )

.factory('baseUrl', function(Settings) {
  return Settings.baseUrl;
} )

.factory('authHttp', [ '$http', 'Settings', function($http, Settings) {
  var authHttp = {};

  $http.defaults.headers.common['X-Mifos-Platform-TenantId'] = Settings.tenant;
  $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
	$http.defaults.headers.common['Accept'] = '*/*';
	$http.defaults.headers.common['Content-type'] = 'application/json';

  authHttp.setAuthHeader = function(key) {
    $http.defaults.headers.common.Authorization = 'Basic ' + key;
		console.log("Authorization header set.");
  };

  authHttp.clearAuthHeader = function() {
    delete $http.defaults.headers.common.Authorization;
  };

  /* Custom headers: GET, HEAD, DELETE */
  angular.forEach(['get', 'delete', 'head'], function (method) {
    authHttp[method] = function(url, config) {
      config = config || {};
      return $http[method](url, config);
    };
  } );

  /* Custom headers: POST, PUT */
  angular.forEach(['post', 'put'], function(method) {
    authHttp[method] = function(url, data, config) {
      config = config || {};
      config.headers = config.headers || {};
      config.headers["X-Mifos-Platform-TenantId"] = Settings.tenant;
      return $http[method](url, data, config);
    };
  } );

  return authHttp;
} ] )

.factory('Session', [ 'baseUrl', 'authHttp', '$http', '$state', function(baseUrl, authHttp, $http, $state) {
  var session = { isOnline: true, role: null };
  session.takeOnline = function() {
    if (!session.isOnline) {
      session.isOnline = true;
    }
  };

  session.takeOffline = function() {
    if (session.isOnline) {
      session.isOnline = false;
    }
  };

  session.login = function(auth, fn_fail) {
    var uri = baseUrl + '/authentication';
    console.log("auth:"+JSON.stringify(auth));
    if (auth.client) {
      uri = baseUrl + '/self/authentication';
    }
    console.log("user: " + auth.username + ", passwd: " + auth.password);
    uri = uri + "?username=" + auth.username + "&password=" + auth.password;
    console.log("uri: " + uri);

    authHttp.clearAuthHeader();
    $http.post(uri, {
      'Accept': 'application/json'
    } ).then(function(response) {

      console.log("Login successful");
      localStorage.setItem('username', auth.username);

      var data = response.data;
      console.log("Response: " + JSON.stringify(data));
      localStorage.setItem('auth', data);

      var b64key = data.base64EncodedAuthenticationKey;
      console.log("B64 Auth Key:" + b64key);
      authHttp.setAuthHeader(b64key);

      var roles = data.roles;
      var role_names = [];
      var role = 'Client';
      for(var i = 0; i < roles.length; ++i) {
        var r = roles[i];
        var rname = r.name;
        if (rname == 'Super User') {
          rname = 'Admin';
        }
        if (rname != 'Client') {
          role = rname;
        }
        role_names.push(rname);
      }
      session.role = role;
      console.log("Role is="+role);
      if ('Client' == role) {
        session.isClient = true;
      }
      localStorage.setItem('session', JSON.stringify(session));
      localStorage.setItem('roles', role_names.join(","));

      $state.go('tab.sacco-list');
    }, function(response) {
      fn_fail(response);
    } );
  };

  session.showByRole = function(r) {
    if (session.role == r) {
      return 'ng-show';
    }
    return 'ng-hide';
  };

  session.hasRole = function(r) {
    console.log("Session::hasRole called for :" + r);
    var roles = localStorage.getItem('roles');
    if (roles.indexOf(r) >= 0) {
      return true;
    }
    return false;
  };

  session.getRole = function() {
    return session.role;
  };

  session.logout = function() {
    console.log("Logout attempt");
    localStorage.removeItem('username');
    localStorage.removeItem('session');
    localStorage.removeItem('roles');
    localStorage.removeItem('auth');
    localStorage.removeItem('clients');
    authHttp.clearAuthHeader();
    $state.go('login');
  };

  session.auth = function() {
    var auth = localStorage.getItem('auth');
    return auth;
  };

  session.username = function() {
    return localStorage.getItem('username');
  };

  session.isAuthenticated = function() {
    return (session.username() != null && session.username() != '');
  };

  session.get = function() {
    return JSON.parse(localStorage.getItem('session'));
  };

  return session;
} ] )

.factory('DataTables', function(authHttp, baseUrl, Settings) {
  return {
    get_meta: function(name, fn_dtable) {
      authHttp.get(baseUrl + '/datatables/' + name).then(function(response) {
        var data = response.data;
        console.log("DTABLE METADATA:" + JSON.stringify(data));
        fn_dtable(data);
      } );
    },
    get: function(name, id, fn_dtable) {
      authHttp.get(baseUrl + '/datatables/' + name + '/' + id).then(function(response) {
        var data = response.data;
        fn_dtable(data);
      } );
    },
    update: function(name, id, fields, fn_fields, fn_fail) {
      authHttp.put(baseUrl + '/datatables/' + name + '/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        fn_office(response.data);
      }, function(response) {
        fn_fail(response);
      } );
    },
    save: function(name, id, fields, fn_fields, fn_fail) {
      authHttp.post(baseUrl + '/datatables/' + name + '/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        console.log("Create " + name + " success. Got: "
          + JSON.stringify(response.data));
        if (fn_fields !== null) {
          fn_fields(response.data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    }
  };
} )
.factory('DateUtil', function() {
  return {
    isoDate: function(a_date) {
      var dd = a_date[2];
      var mm = a_date[1];
      var preproc = function(i) {
        return i > 9 ? i : "0" + i;
      }
      dd = preproc(dd);
      mm = preproc(mm);
      var dt = a_date[0] + "-" + mm + "-" + dd;
      return dt;
    },
    localDate: function(a_date) {
      var dd = a_date[2];
      var mm = a_date[1];
      var dt = new Date(a_date[0] + "-" + mm + "-" + dd);
      return dt.toLocaleDateString();
    }
  };
} )

.factory('Office', function(authHttp, baseUrl, Settings) {
  return {
    dateFields: ["joiningDate", "openingDate"],
    saveFields: ["openingDate", "name", "parentId"],
    prepareForm: function(office) {
      var sfs = this.saveFields;
      for(var i = 0; i < sfs.length; ++i) {
        var k = sfs[i];
        oField[k] = office[k];
      }
    },
    save: function(fields, fn_office, fn_fail) {
      authHttp.post(baseUrl + '/offices', fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        console.log("Create office success. Got: " + JSON.stringify(response.data));
        if (fn_office !== null) {
          fn_office(response.data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    },
    update: function(id, fields, fn_office, fn_fail) {
      authHttp.put(baseUrl + '/offices/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        fn_office(response.data);
      }, function(response) {
        fn_fail(response);
      } );
    },
    get: function(id, fn_office) {
      authHttp.get(baseUrl + '/offices/' + id).then(function(response) {
        var odata = response.data;
        fn_office(odata);
      } );
    },
    query: function(fn_offices) {
      authHttp.get(baseUrl + '/offices').then(function(response) {
        var odata = response.data;
        fn_offices(odata);
      } );
    }
  };
} )

.factory('SACCO', function(Office) {
  return {
    query_saccos: function(fn_saccos) {
    },
    query: function(fn_saccos, fn_sus) {
      Office.query(function(data) {
        var sus = [];
        var po = new Object();
        var saccos = [];
        for(var i = 0; i < data.length; ++i) {
          if (data[i].parentId == 1) {
            sus.push(data[i]);
            po[data[i].id] = data[i].parentId;
          } else {
            var parentId = data[i].parentId;
            var gpId = po[parentId];
            if (gpId != null && gpId == 1) {
              saccos.push(data[i]);
            }
          }
        }
        fn_saccos(saccos);
        fn_sus(sus);
      } );
    },
    query_sacco_unions: function(fn_sunions) {
      Office.query(function(data) {
        var sunions = []; 
        for(var i = 0; i < data.length; ++i) {
          var office = data[i];
          if (data[i].parentId == 1) {
            sunions.push( {
              "id": data[i].id,
              "name": data[i].name
            } );
          }   
        }
        console.log("No. of SUs: " + sunions.length);
        fn_sunions(sunions);
      } );
    }
  };
} )

.factory('Staff', function(authHttp, baseUrl) {
  var staff = [];
  return {
    query: function(fn_staff){
      authHttp.get(baseUrl + '/staff').then(function(response) {
        var staff = response.data;
        console.log("Response data: " + JSON.stringify(staff));
        fn_staff(staff);
      } );
    },
    remove: function(staff){},
    get: function(id, fn_staff) {
      authHttp.get(baseUrl + '/staff/' + id).then(function(response) {
        var sdata = response.data;
        console.log("Got staff: " + JSON.stringify(sdata));
        fn_staff(sdata);
      } );
    }
  }
} )

.factory('FormHelper', function() {
  return {
    prepare_entity: function(entity) {
      var new_ent;
      console.log("Received entity.");
      for(var k in entity) {
        var v = entity[k];
        if ('Object' === typeof(v)) {
          entity[k+"Id"] = v.id;
        }
      }
      return new_ent;
    }
  };
} )

.factory('Clients', function(authHttp, baseUrl, Settings) {
  var clients = [];

  return {
    dateFields: function() {
      return ["dateOfBirth", "activationDate"];
    },
    saveFields: function() {
      return [ "dateOfBirth", "activationDate", "firstname", "lastname",
        "genderId", "mobileNo", "clientClassification", "officeId" ];
    },
    codeFields: function() {
      return {
        "genderId": function(client) {
          return client.gender.id;
        },
        "clientClassificationId": function(client) {
          return client.clientClassification.id;
        }
      }
    },
    prepareForm: function(client) {
      var rClient = new Object();
      var sfs = this.saveFields();
      var cfs = this.codeFields();
      for(var i = 0; i < sfs.length; ++i) {
        var k = sfs[i];
        var fn = cfs[k];
        if (fn) {
          rClient[k] = fn(client);
        } else {
          rClient[k] = client[k];
        }
      }
      return rClient;
    },
    clear: function() {
      localStorage.setItem('clients', "[]")
    },
    query: function(process_clients) {
      clients = JSON.parse(localStorage.getItem('clients'));
      if (clients != null && clients.length) {
        process_clients(clients);
      } else {
        authHttp.get(baseUrl + '/clients')
        .then(function(response) {
          var data = response.data;
          if (data.totalFilteredRecords) {
            var clients = data.pageItems;
            localStorage.setItem('clients', JSON.stringify(clients));
            console.log("Got " + clients.length + " clients");
            process_clients(clients);
          }
        } );
      }
    },
    remove: function(id) {
      clients.splice(clients.indexOf(clients), 1);
    },
    get: function(id, fn_client) {
      clients = JSON.parse(localStorage.getItem('clients'));
      for (var i = 0; i < clients.length; i++) {
        var c = clients[i];
        if (clients[i]["id"] === parseInt(id)) {
          fn_client(clients[i]);
        }
      }
    },
    save: function(client, fn_client, fn_fail) {
      authHttp.post(baseUrl + '/clients', client, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        console.log("Created client resp: "+JSON.stringify(response.data));
      }, function(response) {
        console.log("Client create failed:"+JSON.stringify(response));
        fn_fail(response);
      } );
    },
    update: function(id, client, fn_client, fn_fail) {
      authHttp.put(baseUrl + '/clients/' + id, client, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        console.log("Update client. Response: " + JSON.stringify(response.data));
      }, function(response) {
        console.log("Update failed!. Response status:" + response.status + "; " + JSON.stringify(response.data));
        fn_fail(response);
      } );
    },
    get_accounts: function(id, fn_accts) {
      authHttp.get(baseUrl + '/clients/' + id + '/accounts')
        .then(function(response) {
          var accounts = response.data;
          accounts.share_count = parseInt(Math.random()*11);
          fn_accts(accounts);
        } );
    }
  };
} )

.factory('SelfService', function(authHttp, baseUrl) {
  return {
    query: function(fn_clients) {
      authHttp.get(baseUrl + '/self/clients').then(function(response) {
        var data = response.data;
        if (data.totalFilteredRecords) {
          var clients = data.pageItems;
          console.log("Clients found: " + clients.length);
          fn_clients(clients);
        }
      } );
    },
    remove: function(id) {
      clients.splice(clients.indexOf(clients), 1);
    },
    get: function(id, fn_client) {
      clients = JSON.parse(localStorage.getItem('clients'));
      for (var i = 0; i < clients.length; i++) {
        var c = clients[i];
        if (clients[i]["id"] === parseInt(id)) {
          fn_client(clients[i]);
        }
      }
    }
  };
} )

.factory('ClientImages', function(authHttp, baseUrl) {
  /* ClientImages.get, getB64
   * get image binary, base64 encoded image data
   * Arguments:
   *  1. id - client id
   *  2. fn_img(img) callback function for image
   */
  return {
    get: function(id, fn_img) {
      authHttp.get(baseUrl + '/clients/' + id + '/images', {
        'Accept': 'text/plain'
      } ).then(function(response) {
        console.log("Image for client " + id + " received. Size: " + response.data.length);
        fn_img(response.data);
      } );
    },
    getB64: function(id, fn_img) {
      authHttp.get(baseUrl + '/clients/' + id + '/images', {
        'Accept': 'application/octet-stream'
      } ).then(function(response) {
        console.log("Image for client " + id + " received[b64]. Size: " + response.data.length);
        fn_img(response.data);
      } );
    }
  };
} )

.factory('SavingsAccounts', function(authHttp, baseUrl) {
  return {
    get: function(accountNo, fn_sac) {
      authHttp.get(baseUrl + '/savingsaccounts/' + accountNo)
        .then(function(response) {
          fn_sac(response.data);
        } );
    },
    query: function(fn_accts) {
      console.log("SavingsAccounts.query called");
      authHttp.get(baseUrl + '/savingsaccounts')
        .then(function(response) {
          var data = response.data;
          console.log("Got " + data.totalFilteredRecords + " savings accounts.");
          fn_accts(data.pageItems);
        } );
    }
  };
} )

.factory('LoanAccounts', function(authHttp, baseUrl) {
  return {
    get: function(accountNo, fn_account) {
      authHttp.get(baseUrl + '/loans/' + accountNo)
        .then(function(response) {
          fn_account(response.data);
        } );
    },
    query: function(fn_accounts) {
      console.log("LoanAccounts query called");
      authHttp.get(baseUrl + '/loans')
        .then(function(response) {
          var data = response.data;
          fn_accounts(data.pageItems);
        } );
    }
  };
} )

.factory('Shares', function(authHttp, baseUrl) {
  return {
    get: function(clientId, fn_shares) {
      console.log("Shares called for:"+clientId);
    },
    query: function(fn_shares) {
      console.log("Shares called");
    }
  };
} )

.factory('Codes', function(authHttp, baseUrl) {
  var codeNames = {
    "Gender": 4,
    "ClientClassification": 17,
    "Relationship": 26
  };
  return {
    getId: function(codeNm) {
      var cid = codeNames[codeNm];
      if (cid != null) {
        return cid;
      }
      return 0;
    },
    getValues: function(code, fn_codevalues) {
      authHttp.get(baseUrl + '/codes/' + code + '/codevalues')
        .then(function(response) {
          console.log("Got code response");
          fn_codevalues(response.data);
        }, function(response) {
          console.log("Failed to get codes:" + response.status);
        } );
    }
  };
} )
;

