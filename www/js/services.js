angular.module('starter.services', [])

.factory('baseUrl', function() {
  return "https://demo.openmf.org/mifosng-provider/api/v1";
} )

.factory('authHttp', [ '$http', function($http) {
  var authHttp = {};

  $http.defaults.headers.common['X-Mifos-Platform-TenantId'] = 'default';
  $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

  authHttp.setAuthHeader = function(key) {
    $http.defaults.headers.common.Authorization = 'Basic ' + key;
  };

  authHttp.clearAuthHeader = function() {
    delete $http.defaults.headers.common.Authorization;
  };

  angular.forEach(['get', 'delete', 'head'], function (method) {
    authHttp[method] = function(url, config) {
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
  }, {
    id: 3,
    name: 'A. Tadesse',
    fullname: 'Sir Abel Tadesse',
    face: 'img/adam.jpg'
  }, {
    id: 4,
    name: 'A. Ketahun',
    fullname: 'Aulugeta Ketahun',
    face: 'img/perry.png'
  }, {
    id: 5,
    name: 'Mike Hington',
    fullname: 'Michael Huffington',
    face: 'img/mike.png'
  } ];

  authHttp.get(baseUrl + '/clients', function(response) {
    clients = response;
  } );

  return {
    all: function() {
      authHttp.get(baseUrl + '/clients', function(response) {
        clients = response;
        console.log("Clients: " + clients.length);
      } );
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
