angular.module('starter.services', [])

.factory('baseUrl', function() {
  return "https://demo.openmf.org/mifosng-provider/api/v1";
} )

.factory('authHttp', [ '$http', function($http) {
  var authHttp = {};

  $http.defaults.headers.common['X-Mifos-Platform-TenantId'] = 'default';
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

  angular.forEach(['post', 'put'], function(method) {
    authHttp[method] = function(url, data, config) {
      config = config || {};
      return $http[method](url, data, config);
    };
  } );

  return authHttp;
} ] )

.factory('Staff', function(authHttp) {
  var staff = [ {

  } ];
  return {
    all: function(){},
    remove: function(staff){},
    get: function(staff){}
  }
} )

.factory('Clients', function(authHttp, baseUrl) {
  var clients = [];

  return {
    query: function(fn) {
			authHttp.get(baseUrl + '/clients').then(function(response) {
				var data = response["data"];
				var rClients = data["pageItems"];
				clients = rClients;
				console.log("Response received: " + clients.length);
				fn(clients);
			} );
    },
    remove: function(id) {
      clients.splice(clients.indexOf(clients), 1);
    },
    get: function(id, fn) {
			authHttp.get(baseUrl + '/clients/' + id).then(function(response) {
				var data = response["data"];
				console.log("Response data:"+JSON.stringify(data));
				fn(data);
			} );
    }
  };
} );
