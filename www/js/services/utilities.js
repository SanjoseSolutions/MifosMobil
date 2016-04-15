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

 *  Filename: www/js/services.js
 *  This file has a set of services
 *  Current services available (to be kept up-to-date)
 *    1. baseUrl: the base URL of Mifos X backend
 *    2. authHttp: HTTP + Authentication (wraps around http)
 *    3. Session: login, logout, username, authinfo
 *    3. resources: Clients, Staff
 */

angular.module('mifosmobil.utilities', ['ngCordova'])

.factory('logger', [ '$rootScope', function($rootScope) {
  var logger = {};
  $rootScope.messages = [];
  angular.forEach(['log', 'warn', 'info'], function(method) {
    logger[method] = function(msg) {
      var dt = new Date();
      $rootScope.messages.unshift( {
        time: dt.toISOString().substr(0,10) + ' ' + dt.toLocaleTimeString().substr(0,8),
          // for milliseconds + '.' + ('0' + dt.getMilliseconds()).slice(-3),
        type: 'log',
        text: msg
      } );
      console[method](msg);
    };
  } );
  return logger;
} ] )

.factory('Cache', ['logger', function(logger) {
  var index = {};
  var lastSync = null;
  var get_cached = function(key) {
    return localStorage.getItem(key);
  };
  return {
    get: get_cached,
    set: function(key, val) {
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
      var new_cache = {};
      var pkeys = Object.keys(index).filter(function(e) {
        return e.match('^(passwd|codevalues)\.');
      } );
      angular.forEach(pkeys, function(k) {
        new_cache[k] = get_cached(k);
      } );
      localStorage.clear();
      for(k in new_cache) {
        this.set(k, new_cache[k]);
        index[k] = 1;
      }
    },
    'updateLastSync': function() {
      lastSync = new Date();
    },
    'lastSyncSince': function() {
      return lastSync ? lastSync.toLocaleString() : "Never";
    }
  };
} ] )

.factory('DateUtil', function() {
  return {
    isoDateStr: function(a_date) {
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
    isoDate: function(a_date) {
      if (a_date instanceof Array) {
        var dtStr = this.isoDateStr(a_date);
        var dt = new Date(dtStr);
        return dt;
      }
      return a_date;
    },
    localDate: function(a_date) {
      if (a_date instanceof Array) {
        var dt = new Date(a_date.join("-"));
        return dt.toLocaleDateString();
      }
      return a_date;
    },
    toISODateString: function(dt) {
      return dt.toISOString().substr(0,10);
    }
  };
} )

.factory('HashUtil', function(logger) {
  return {
    from_a: function(a) {
      var obj = new Object();
      for(var i = 0; i < a.length; ++i) {
        obj[a[i].id] = a[i];
      }
      return obj;
    },
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
        if ('T' == k.charAt(0)) {
          ++id;
        }
      }
      var nk = "T" + id.toString();
      logger.log("Got nextKey:" + nk);
      return nk;
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

.factory('Camera', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();

      if (navigator.camera) {
        navigator.camera.getPicture(function(result) {
          // Do any magic you need
          q.resolve(result);
        }, function(err) {
          q.reject(err);
        }, options);
      } else {
        q.reject("Camera not available");
      }

      return q.promise;
    }
  }
}])

;