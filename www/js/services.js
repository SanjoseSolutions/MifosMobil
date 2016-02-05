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
			var b64key = localStorage.getItem("b64key");
			console.log("Got b64key:"+b64key);
			if (b64key != null) {
				authHttp.setAuthHeader(b64key);
			}
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

  session.login = function(auth) {
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

.factory('DataTables', function(authHttp, baseUrl) {
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
        console.log("Datatable DATA:" + JSON.stringify(data));
        fn_dtable(data);
      } );
    }
  };
} )
.factory('DateFmt', function() {
  return {
    localDate: function(a_date) {
      var dt = new Date(a_date[0] + "-" + a_date[1] + "-" + a_date[2]);
      return dt.toLocaleDateString();
    }
  };
} )

.factory('Office', function(authHttp, baseUrl) {
  return {
    post: function(fields, fn_office) {
      authHttp.post(baseUrl + '/offices', fields)
      .then(function(response) {
        console.log("Create office success. Got: " + JSON.stringify(response.data));
        if (fn_office !== null) {
          fn_office(response.data);
        }
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
    query_sacco_unions: function(fn_sunions) {
      Office.query(function(data) {
        var sunions = []; 
        for(var i = 0; i < data.length; ++i) {
          var office = data[i];
          console.log("Got office: " + office.id);
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

.factory('Clients', function(authHttp, baseUrl, Settings) {
  var clients = [ {
    id: 1,
    name: 'Ben Wallace',
    fullname: 'Benjamin Wallace',
    face: 'img/ben.png'
  }, {
    id: 2,
    name: 'M. Mirnyi',
    fullname: 'Max Mirnyi',
    face: 'img/max.png'
  } ];

  return {
    query: function(process_clients) {
      authHttp.get(baseUrl + '/clients').then(function(response) {
        var data = response.data;
        if (data.totalFilteredRecords) {
          var clients = data.pageItems;
          localStorage.setItem('clients', JSON.stringify(clients));
          console.log("Got " + clients.length + " clients");
          process_clients(clients);
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
        console.log("Client id:" + c.id + "/" + c["id"] + "::" + JSON.stringify(c));
        if (clients[i]["id"] === parseInt(id)) {
          fn_client(clients[i]);
        }
      }
    },
    save: function(client, fn_client) {
      authHttp.post(baseUrl + '/clients', client).then(function(response) {
        console.log("Created client resp: "+JSON.stringify(response.data));
      } );
    },
    update: function(id, client, fn_client) {
      authHttp.put(baseUrl + '/clients/' + id, client, {
        "params": { "tenantIdentifier": Settings.tenant }
      } ).then(function(response) {
        console.log("Update client. Response: " + JSON.stringify(response.data));
      }, function(response) {
        console.log("Update failed!. Response status:" + response.status + "; " + JSON.stringify(response.data));
      } );
    },
    get_accounts: function(id, fn_accts) {
      authHttp.get(baseUrl + 'clients/' + id + '/accounts')
        .then(function(response) {
          var accounts = response.data;
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
} );

