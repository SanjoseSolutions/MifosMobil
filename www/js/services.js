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

  authHttp.setAuthHeader = function(key) {
    $http.defaults.headers.common.Authorization = 'Basic ' + key;
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
      var role = 'Client';
      for(var i = 0; i < roles.length; ++i) {
        var r = roles[i];
        console.log("Got role: " + JSON.stringify(r));
        if (r.name == 'Super User') {
          role = 'Admin';
          session.isAdmin = true;
          break;
        }
        if (r.name == 'Staff') {
          role = 'Staff';
          session.isStaff = true;
        }
      }
      session.role = role;
      console.log("Role is="+role);
      if ('Client' == role) {
        session.isClient = true;
      }
      localStorage.setItem('session', session);

      $state.go('tab.dash');
    } );
  };

  session.hasRole = function(r) {
    console.log("Session::hasRole called for :" + r);
    var saved_session = localStorage.getItem('session');
    if (saved_session) {
      session.role = saved_session.role;
    }
    console.log("Got role:"+session.role);
    if (null == session.role) {
      return 'ng-hide';
    }
    if ('Super User' == session.role) {
      return 'ng-show';
    }
    if ('Staff' == r || 'Client' == r) {
      return (r == session.role) ? 'ng-show' : 'ng-hide';
    }
    return 'ng-hide';
  };

  session.getRole = function() {
    return session.role;
  };

  session.logout = function() {
    console.log("Logout attempt");
    localStorage.removeItem('username');
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

  return session;
} ] )

.factory('Staff', function(authHttp) {
  var staff = [ {

  } ];
  return {
    query: function(){},
    remove: function(staff){},
    get: function(staff){}
  }
} )

.factory('Clients', function(authHttp, baseUrl) {
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
} );

