/*  This is the services script - contains key app services
 *  Current services available (this should be kept up-to-date)
 *    1. baseUrl: the base URL of Mifos X backend
 *    2. authHttp: HTTP + Authentication (wraps around http)
 *    3. Session: login, logout, username, authinfo
 *    3. resources: Clients, Staff
 */

angular.module('starter.services', [])

.factory('baseUrl', function() { return "https://kifiya.openmf.org/mifosng-provider/api/v1"; } )

.factory('authHttp', [ '$http', function($http) {
  var authHttp = {};

  $http.defaults.headers.common['X-Mifos-Platform-TenantId'] = 'kifiya';
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

.factory('Session', function(baseUrl, authHttp, $http, $state) {
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
        if (r.name == 'Super User') {
          role = 'Admin';
          break;
        }
        if (r.name == 'Staff') {
          role = 'Staff';
        }
      }
      session.role = role;

      $state.go('tab.dash');
    } );
  };

  session.hasRole = function(r) {
    console.log("Session::hasRole called for :" + r);
    if (null == session.role) {
      return false;
    }
    if ('Super User' == session.role) {
      return true;
    }
    if ('Staff' == r || 'Client' == r) {
      return (r == session.role);
    }
    return false;
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
} )

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

  authHttp.get(baseUrl + '/clients', function(response) {
    clients = response;
  } );

  return {
    query: function() {
      var username = localStorage.getItem('username');
      if (username) {
        /* we are logged in. attempt to get clients */
        authHttp.get(baseUrl + '/clients').then(function(response) {
          console.log("Response: " + JSON.stringify(response));
          clients = response;
          console.log("Got " + clients.length + " clients");
          console.log("Client JSON: " + JSON.stringify(clients));
        } );
      }
      return clients;
    },
    remove: function(id) {
      clients.splice(clients.indexOf(clients), 1);
    },
    get: function(id) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].id === parseInt(id)) {
          return clients[i];
        }
      }
      return {};
    }
  };
} );
