/*  This is the services script - contains key app services
 *  Current services available (this should be kept up-to-date)
 *    1. baseUrl: the base URL of Mifos X backend
 *    2. authHttp: HTTP + Authentication (wraps around http)
 *    3. Session: login, logout, username, authinfo
 *    3. resources: Clients, Staff
 */

angular.module('starter.services', ['ngCordova'] )

.factory('Settings', function() {
  return {
    'baseUrl': 'https://kifiya.openmf.org/mifosng-provider/api/v1',
    'tenant': 'kifiya',
    'showClientListFaces': false
  };
} )

.factory('Cache', function() {
  var index = {};
  var lastSync = null;
  return {
    'get': function(key) {
      return localStorage.getItem(key);
    },
    'set': function(key, val) {
      localStorage.setItem(key, val);
      index[key] = 1;
    },
    'getObject': function(key) {
      var str = localStorage.getItem(key);
      return str ? JSON.parse(str) : null;
    },
    'setObject': function(key, obj) {
      var str = JSON.stringify(obj);
      localStorage.setItem(key, str);
      index[key] = 1;
    },
    'remove': function(key) {
      localStorage.removeItem(key);
      delete index[key];
    },
    'clear': function() {
      for(var key in index) {
        localStorage.removeItem(key);
      }
      index = {};
      lastSync = new Date();
    },
    'lastSyncSince': function() {
      return lastSync ? lastSync.toLocaleString() : "Never";
    }
  };
} )

.factory('baseUrl', function(Settings) {
  return Settings.baseUrl;
} )

.factory('authHttp', [ '$http', 'Settings', '$cordovaNetwork', 'Cache',
    function($http, Settings, $cordovaNetwork, Cache) {

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
    authHttp[method] = function(url, data, config, fn_success, fn_failure) {
      config = config || {};
      config.headers = config.headers || {};
      config.headers["X-Mifos-Platform-TenantId"] = Settings.tenant;
      if (window.Connection && $cordovaNetwork.isOffline()) {
        var commands = Cache.getObject('commands');
        commands.push( {
          'method': method,
          'url': url,
          'data': data,
          'config': config
        } );
        Cache.setObject('commands', commands);
        if ('put' == method) {
          console.log("Offline put attempted");
        } else {
          console.log("Offline post attempted");
        }
        fn_success( {
          'status': 202,
          'data': data
        } );
      } else {
        $http[method](url, data, config).then(fn_success, fn_failure);
      }
    };
  } );

  authHttp.runCommands = function() {
    var commands = Cache.getObject('commands');
    for(var i = 0; i < commands.length; ++i) {
      var cmd = commands[i];
      var method = cmd['method'];
      var url = cmd['url'];
      var data = cmd['data'];
      var config = cmd['config'];
      $http[method](url, data, config);
    }
    Cache.setObject('commands', []);
  };

  return authHttp;
} ] )

.factory('Roles', function(Cache) {
  return {
    roleList: function() {
      return [ 'Super User', 'Admin', 'Management', 'Staff', 'Client' ];
    },
    roleHash: function() {
      return {
        'Super user': 4,
        'Admin': 4,
        'Management': 3,
        'Staff': 2,
        'Client': 1
      };
    },
    setRoles: function(roles) {
      var roleList = this.roleList();
      var roleVal = 0;
      var roleHash = this.roleHash();
      for(var i = 0; i < roles.length; ++i) {
        var rName = roles[i].name;
        console.log("Got role:"+rName);
        var rVal = roleHash[rName];
        console.log('rVal='+rVal);
        if (rVal > roleVal) {
          roleVal = rVal;
        }
      }
      console.log("roleVal="+roleVal);
      var roleNames = [];
      for(var i = 5 - roleVal; i < 5; ++i) {
        roleNames.push(roleList[i]);
      }
      var rolesStr = roleNames.join(",");
      console.log("Role String: " + rolesStr);
      Cache.set('roles', rolesStr);
      return roleNames;
    },
    getRoles: function() {
      var rolesStr = Cache.get('roles');
      var roles = rolesStr.split(',');
      return roles;
    }
  };
} )

.factory('Session', [ 'baseUrl', 'authHttp', '$http', '$state', 'Roles',
    'Cache', function(baseUrl, authHttp, $http, $state, Roles, Cache) {

  var session = { isOnline: true, role: null, loginTime: null };
  session.takeOnline = function() {
    if (!session.isOnline) {
      session.isOnline = true;
    }
  };

  session.lastSyncSince = function() {
    return Cache.lastSyncSince();
  };

  session.takeOffline = function() {
    session.isOnline = false;
  };

  session.takeOnline = function() {
    session.isOnline = true;
  };

  session.status = function() {
    return session.isOnline ? "Online" : "Offline";
  };

  session.loggedInTime = function() {
    return session.loginTime ? session.loginTime.toLocaleString() : "Never";
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

      session.loginTime = new Date();
      console.log("Login successful");
      Cache.set('username', auth.username);
      Cache.setObject('commands', []);

      var data = response.data;
      console.log("Response: " + JSON.stringify(data));
      Cache.setObject('auth', data);

      var roles = Roles.setRoles(data.roles);
      var role = roles[0];
      session.role = role;
      
      var b64key = data.base64EncodedAuthenticationKey;
      console.log("B64 Auth Key:" + b64key);
      authHttp.setAuthHeader(b64key);

      Cache.setObject('session', session);

      $state.go('tab.dashboard');
    }, function(response) {
      fn_fail(response);
    } );
  };

  session.hasRole = function(r) {
    console.log("Session::hasRole called for :" + r);
    var roles = Cache.get('roles');
    console.log("Roles:"+roles+",role:"+r);
    if (roles.indexOf(r) >= 0) {
      return true;
    }
    return false;
  };

  session.showByRole = function(r) {
    console.log("Called showByRole:"+r);
    if (session.hasRole(r)) {
      return "ng-show";
    }
    return "ng-hide";
  };

  session.logout = function() {
    console.log("Logout attempt");
    authHttp.clearAuthHeader();
    Cache.clear();
    $state.go('login');
  };

  session.auth = function() {
    var auth = Cache.get('auth');
    return auth;
  };

  session.username = function() {
    return Cache.get('username');
  };

  session.isAuthenticated = function() {
    return (session.username() != null && session.username() != '');
  };

  session.get = function() {
    return Cache.getObject('session');
  };

  return session;
} ] )

.factory('DataTables', function(authHttp, baseUrl, Settings) {
  return {
    decode: function(obj) {
      var ret = new Object();
      for(var f in obj) {
        var m = f.match(/(.*)_cd_.*/);
        var v;
        if (m) {
          ret[obj[m[1]]] = obj[f];
        } else {
          ret[f] = obj[f];
        }
      }
      return ret;
    },
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
      }, function(response) {
        fn_fields(response.data);
      }, function(response) {
        fn_fail(response);
      } );
    },
    save: function(name, id, fields, fn_fields, fn_fail) {
      authHttp.post(baseUrl + '/datatables/' + name + '/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
          console.log("Request accepted (server offline)");
        } else {
          console.log("Create " + name + " success. Got: "
            + JSON.stringify(response.data));
        }
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

.factory('Office', function(authHttp, baseUrl, Settings, Cache) {
  return {
    dateFields: function() {
      return ["joiningDate"];
    }, // "openingDate"],
    saveFields: function() {
      return ["openingDate", "name", "parentId"];
    },
    codeFields: function() { return []; },
    prepareForm: function(office) {
      var sfs = this.saveFields;
      for(var i = 0; i < sfs.length; ++i) {
        var k = sfs[i];
        oField[k] = office[k];
      }
    },
    save: function(fields, fn_office, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/offices', fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
          console.log("Create office request accepted");
          fn_offline(response.data);
          return;
        }
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
      }, function(response) {
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
      offices = Cache.getObject('offices') || [];
      if (offices.length) {
        fn_offices(offices);
        return;
      }
      authHttp.get(baseUrl + '/offices').then(function(response) {
        var odata = response.data.sort(function(a, b) { return a.id - b.id } );
        Cache.setObject('offices', odata);
        fn_offices(odata);
      } );
    }
  };
} )

.factory('SACCO_Fields', function(DataTables) {
  return {
    dateFields: function() { return ['joiningDate']; },
    skipFields: function() { return []; },
    saveFields: function() { return ['joiningDate', 'Country', 'Region', 'Zone', 'Wereda', 'Kebele']; },
    codeFields: function() { return {}; },
    get: function(officeId, fn_dtable) {
      DataTables.get('SACCO_Fields', officeId, fn_dtable);
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

.factory('Staff', function(authHttp, baseUrl, Cache) {
  var staff = [];
  return {
    query: function(fn_staff){
      staff = Cache.getObject('staff') || [];
      if (staff.length) {
        fn_staff(staff);
        return;
      }
      authHttp.get(baseUrl + '/staff').then(function(response) {
        staff = response.data.sort(function(a, b) {
          return a.id - b.id;
        } );
        console.log("Going to cache " + staff.length + "staff.");
        Cache.setObject('staff', staff);
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

.factory('FormHelper', function(DateUtil) {
  return {
    prepareForm: function(type, object) {
      console.log("Called FormHelper.prepareForm " + typeof(object));
      var rObject = new Object();
      var sfs = type.saveFields();
      var cfs = type.codeFields();
      var dfs = type.dateFields();
      var dfHash = new Object();
      for(var i = 0; i < dfs.length; ++i) {
        dfHash[dfs[i]] = 1;
      }
      for(var i = 0; i < sfs.length; ++i) {
        var k = sfs[i];
        var fn = cfs[k];
        var v = object[k];
        if (fn) {
          rObject[k] = fn(object);
        } else if (dfHash[k]) { 
          rObject[k] = new Date(DateUtil.isoDate(v));
        } else {
          rObject[k] = v;
        }
      }
      return rObject;
    },
    preSaveForm: function(type, object) {
      console.log("Called FormHelper.preSaveForm with " + typeof(type) + ", " + typeof(object));
      var sObject = new Object();
      var skf = type.skipFields();
      var svf = type.saveFields();
      var dfs = type.dateFields();
      var dfHash = new Object();
      for(var i = 0; i < dfs.length; ++i) {
        dfHash[dfs[i]] = 1;
      }
      for(var i = 0; i < svf.length; ++i) {
        var k = svf[i];
        if (skf[k]) {
          console.log("Skipping field: " + k);
          continue;
        }
        if (dfHash[k]) {
          var dt = object[k];
          sObject[k] = dt.toISOString().substr(0, 10);
        } else {
          sObject[k] = object[k];
        }
      }
      sObject.dateFormat = "yyyy-MM-dd";
      sObject.locale = "en";
      return sObject;
    },
  };
} )

.factory('HashUtil', function() {
  return {
    isEmpty: function(obj) {
      for(var k in obj) {
        if (obj.hasOwnProperty(k)) {
          return false;
        }
      }
      return true;
    },
    copy: function(dest, src) {
      for(var k in src) {
        dest[k] = src[k];
      }
    },
    nextKey: function(obj) {
      var id = 1;
      for(var k in obj) {
        if ('T' == k.chatAt(0)) {
          ++id;
        }
      }
      return "T" + id.toString();
    },
    to_a: function(obj) {
      var a = new Array();
      for(var k in obj) {
        a.push(obj[k]);
      }
      return a;
    }
  };
} )

.factory('Clients', function(authHttp, baseUrl, Settings, Cache, HashUtil) {
  var clients = null;

  return {
    dateFields: function() {
      return ["dateOfBirth", "activationDate"];
    },
    saveFields: function() {
      return [ "dateOfBirth", "activationDate", "firstname", "lastname",
        "genderId", "mobileNo", "clientClassificationId", "officeId" ];
    },
    skipFields: function() {
      return { "officeId": true }
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
    dataTables: function() {
      return [ "Client_Fields", "Client_NextOfKin" ];
    },
    query: function(process_clients) {
      clients = Cache.getObject('h_clients');
      if (clients) {
        console.log("Got cached clients: " + typeof(clients));
        if (!HashUtil.isEmpty(clients)) {
          console.log("Clients.query got cached clients");
          var a_clients = [];
          for(var id in clients) {
            a_clients.push(clients[id]);
          }
          process_clients(a_clients);
        }
      } else {
        console.log("Clients.query got no cached clients");
        authHttp.get(baseUrl + '/clients')
        .then(function(response) {
          var data = response.data;
          if (data.totalFilteredRecords) {
            var a_clients = data.pageItems;
            clients = {};
            for(var i = 0; i < a_clients.length; ++i) {
              var c = a_clients[i];
              console.log("Setting client " + c.id + " = " + JSON.stringify(c));
              clients[c.id] = c;
            }
            Cache.setObject('h_clients', clients);
            console.log("Got " + a_clients.length + " clients");
            process_clients(a_clients);
          }
        } );
      }
    },
    remove: function(id) {
      delete clients[id];
    },
    get: function(id, fn_client) {
      clients = Cache.getObject('h_clients');
      if (clients) {
        console.log("Clients.get found cached " + typeof(clients));
        var client = clients[id];
        console.log("Clients.get for: " + id + " :: " + JSON.stringify(client));
        fn_client(client);
      }
    },
    save: function(client, fn_client, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/clients', client, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.code) {
          var id = HashUtil.nextKey();
          client["id"] = id;
          clients = Cache.getObject('h_clients') || {};
          clients[id] = client;
          Cache.setObject('h_clients', clients);
          fn_offline(client);
        } else {
          console.log("Created client resp: "+JSON.stringify(response.data));
          var new_client = response.data;
          fn_client(new_client);
        }
      }, function(response) {
        console.log("Client create failed:"+JSON.stringify(response));
        fn_fail(response);
      } );
    },
    update: function(id, client, fn_client, fn_offline, fn_fail) {
      authHttp.put(baseUrl + '/clients/' + id, client, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.code) {
          clients = Cache.getObject('h_clients');
          if (clients.hasOwnProperty(id)) {
            var eClient = clients[id];
            HashUtil.copy(eClient, client);
            Cache.setObject('h_clients', clients);
            fn_offline(eClient);
          }
        } else {
          console.log("Update client. Response: " + JSON.stringify(response.data));
          fn_client(response.data);
        }
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

.factory('SelfService', function(authHttp, baseUrl, Cache) {
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
      clients = Cache.getObject('h_clients');
      if (clients.hasOwnProperty(id)) {
        var c = clients[id];
        fn_client(c);
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
      authHttp.get(baseUrl + '/savingsaccounts/' + accountNo + '?associations=transactions')
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
    },
    withdraw: function(id, params, fn_res, fn_err) {
      authHttp.post(baseUrl + '/savingsaccounts/' + id + '/transactions?command=withdrawal',
        params, {}, function(response) {
          var data = response.data;
          fn_res(data);
        }, function(response) {
          console.log("Failed to withdraw. Received " + response.status);
          fn_err(response);
        } );
    },
    deposit: function(id, params, fn_res, fn_err) {
      authHttp.post(baseUrl + '/savingsaccounts/' + id + '/transactions?command=deposit',
        params, {}, function(response) {
          var data = response.data;
          fn_res(data);
        }, function(response) {
          console.log("Failed to deposit. Received " + response.status);
          fn_err(response);
        } );
    },
  };
} )

.factory('LoanAccounts', function(authHttp, baseUrl) {
  return {
    get: function(accountNo, fn_account) {
      authHttp.get(baseUrl + '/loans/' + accountNo + '?associations=transactions')
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

.factory('Codes', function(authHttp, baseUrl, Cache) {
  var codeNames = {
    "Gender": 4,
    "ClientClassification": 17,
    "Relationship": 26
  };

  var codesObj = {
    getValues: function(codename, fn_codevalues) {
      var code = codeNames[codename];
      var h_codevalues = Cache.getObject('h_codevalues') || {};
      if (h_codevalues && h_codevalues.hasOwnProperty(code)) {
        fn_codevalues(h_codevalues[code]);
      } else {
        authHttp.get(baseUrl + '/codes/' + code + '/codevalues')
          .then(function(response) {
            var codeValues = response.data;
            console.log("Got code response: " + JSON.stringify(codeValues));
            h_codevalues[code] = codeValues;
            Cache.setObject('h_codevalues', h_codevalues);
            fn_codevalues(codeValues);
          }, function(response) {
            console.log("Failed to get codes:" + response.status);
          } );
      }
    }
  };

  return {
    getValues: function(codename, fn_codevalues) {
      codesObj.getValues(codename, fn_codevalues);
    },
    init: function() {
      authHttp.get(baseUrl + '/codes')
        .then(function(response) {
          var codes = response.data;
          for(var i = 0; i < codes.length; ++i) {
            var code = codes[i];
            var cname = code.name;
            if (codeNames.hasOwnProperty(cname)) {
              var cid = code.id;
              if (codeNames[cname] != cid) {
                codeNames[cname] = cid;
              }
              var h_codevalues = {};
              codesObj.getValues(cname, function(codeValues) {} );
            }
          }
        } );
    },
    getId: function(codeNm) {
      var cid = codeNames[codeNm];
      if (cid != null) {
        return cid;
      }
      return 0;
    }
  };
} )
;

