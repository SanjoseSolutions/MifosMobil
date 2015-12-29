angular.module('starter.services', [])

.factory('Clients', function($http) {
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

  $http.get('js/client-data.json', function(response) {
    clients = response;
  } );

  return {
    all: function() {
      console.log("Clients: " + clients.length);
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
