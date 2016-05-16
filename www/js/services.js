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

angular.module('starter.services', ['ngCordova'] )

.factory('Settings', function() {
  return {
    'baseUrl': 'https://kifiya.openmf.org/fineract-provider/api/v1',
    'tenant': 'kifiya',
    'showClientListFaces': false
  };
} )

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
  console.log("dsadasdasdasd");
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
      console.log("======sadasda");
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
    'clearAll': function() {
      logger.log("Called Cache.clearAll()");
      var keys = Object.keys(index);
      index = {};
      logger.log("Got keys: " + keys.join(", "));
      for(var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (key.match(/^passwd\./)) {
          index[key] = 1;
        } else {
          logger.log("Going to clear key: " + key);
          localStorage.removeItem(key);
        }
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

.factory('baseUrl', function(Settings) {
  return Settings.baseUrl;
} )

.factory('authHttp', [ '$http', 'Settings', '$cordovaNetwork', 'Cache', 'logger',
    function($http, Settings, $cordovaNetwork, Cache, logger) {

  var authHttp = {};

  $http.defaults.headers.common['Fineract-Platform-TenantId'] = Settings.tenant;
  $http.defaults.headers.common['Accept'] = '*/*';
  $http.defaults.headers.common['Content-type'] = 'application/json';

  authHttp.setAuthHeader = function(key) {
    $http.defaults.headers.common.Authorization = 'Basic ' + key;
    logger.log("Authorization header set.");
  };

  authHttp.clearAuthHeader = function() {
    logger.log("Clearing authorization header");
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
      config.headers["Fineract-Platform-TenantId"] = Settings.tenant;
      if (window.Connection && $cordovaNetwork.isOffline()) {
        var cmd = {
          'method': method,
          'url': url,
          'data': data,
          'config': config
        };
        var commands = Cache.getObject('commands');
        var len = commands.length;
        commands.push(cmd);
        logger.log("Command cached: " + JSON.stringify(cmd));
        Cache.setObject('commands', commands);
        fn_success( {
          'status': 202,
          'data': data,
          'cid': len
        } );
      } else {
        $http[method](url, data, config).then(fn_success, fn_failure);
      }
    };
  } );

  authHttp.saveOffline = function(url, data, config, rid) {
    config = config || {};
    config.headers = config.headers || {};
    config.headers["Fineract-Platform-TenantId"] = Settings.tenant;
    var cmd = {
      'method': 'post',
      'url': url,
      'data': data,
      'config': config
    };
    var commands = Cache.getObject('commands');
    var subcmds = commands[rid]['commands'] || [];
    subcmds.push(cmd);
    commands[rid]['commands'] = subcmds;
    Cache.setObject('commands', commands);
    logger.log("Subcommand #"+subcmds.length+" of cmd " + rid + " cached: " + JSON.stringify(cmd));
  };

  authHttp.runCommands = function(fn_init, fn_success, fn_fail, fn_final) {
    var commands = Cache.getObject('commands');
    logger.log("LOADED CACHED COMMANDS: " + commands.length);
    fn_init(commands.length);
    var results = [];
    var cmdIndex = 0;
    var runNextCmd = function() {
      cmd = commands.shift();
      var method = cmd['method'];
      var url = cmd['url'];
      var data = cmd['data'];
      var config = cmd['config'];
      var subcmds = cmd['commands'];
      $http[method](url, data, config)
        .then(function(response) {
          var rdata = response.data;
          if (subcmds) {
            logger.log("Got subcommands #=" + subcmds.length);
            var resId = rdata['resourceId'];
            for(var i = 0; i < subcmds.length; ++i) {
              var scmd = subcmds[i];
              scmd['url'] = scmd['url'] + resId;
              commands.push(scmd);
              setTimeout(runNextCmd, 2000);
            }
          }
          fn_success(); //method, url, data, response)
        }, function(response) {
          logger.log("Failed offline cmd " + method +  " to "
            + url +  ": " + response.status
            + " :: " + JSON.stringify(response.data));
          results.push(response.data);
          fn_fail(); //method, url, data, response);
        } );
      if (commands.length) {
        setTimeout(runNextCmd, 2000);
      } else {
        Cache.setObject('commands', []);
        fn_final();
      }
    };
    setTimeout(runNextCmd, 1000);
  };

  return authHttp;
} ] )

.factory('Network', [ '$cordovaNetwork', function($cordovaNetwork) {
  var network = $cordovaNetwork;
  return network;
} ] )

.factory('CommandQueue', function(authHttp, logger) {
  return {
    get: function() {
      var commands = Cache.getObject('commands');
      return commands;
    },
    length: function() {
      var commands = Cache.getObject('commands');
      return commands.length;
    },
    add: function(cmd) {
      var commands = Cache.getObject('commands');
      var n = commands.length;
      commands.push(cmd);
      Cache.setObject('commands', commands);
      logger.log("Had " + n + " commands. Added cmd:" + JSON.stringify(cmd));
    },
    remove: function() {
      var commands = Cache.getObject('commands');
      var cmd = commands.shift();
      Cache.setObject('commands', commands);
      logger.log("Deleted from commands. Have " + commands.length);
      return cmd;
    },
    empty: function() {
      var commands = Cache.getObject('commands');
      return (commands.length == 0);
    },
    runAndRemoveOne: function(fn_success, fn_fail) {
      var cmd = this.remove();
      var method = cmd['method'];
      var url = cmd['url'];
      var data = cmd['data'];
      var config = cmd['config'];
      $http[method](url, data, config).then(fn_success, fn_fail);
    },
    runAndRemoveAll: function(fn_success, fn_fail) {
    }
  };
} )

.factory('Roles', function(Cache, logger) {
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
        logger.log("Got role:"+rName);
        var rVal = roleHash[rName];
        logger.log('rVal='+rVal);
        if (rVal > roleVal) {
          roleVal = rVal;
        }
      }
      logger.log("roleVal="+roleVal);
      var roleNames = [];
      for(var i = 5 - roleVal; i < 5; ++i) {
        roleNames.push(roleList[i]);
      }
      var rolesStr = roleNames.join(",");
      logger.log("Role String: " + rolesStr);
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

.factory('Session', [ 'baseUrl', 'authHttp', '$http', '$state', 'Roles', 'Cache', 
    'Codes', 'logger', '$rootScope', '$cordovaNetwork', function(baseUrl, authHttp,
    $http, $state, Roles, Cache, Codes, logger, $rootScope, $cordovaNetwork) {

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

  session.login = function(auth, fn_success, fn_fail) {

    var onLogin = function(data) {
      session.loginTime = new Date();
      Cache.set('username', auth.username);
      session.uname = auth.username;
      Cache.setObject('commands', []);

      logger.log("Response: " + JSON.stringify(data));
      Cache.setObject('auth', data);

      var roles = Roles.setRoles(data.roles);
      var role = roles[0];
      session.role = role;

      var b64key = data.base64EncodedAuthenticationKey;
      logger.log("Base64key: " + b64key);
      authHttp.setAuthHeader(b64key);

      Cache.setObject('session', session);
      Codes.init();
    };

    if (window.Connection && $cordovaNetwork.isOffline()) {
      logger.log("Attempting offline login..");
      var authinfo = Cache.getObject('passwd.'+auth.username);
      logger.log("Got cached authinfo: " + JSON.stringify(authinfo));
      if (authinfo.password == auth.password) {
        logger.log("Succesful login :-)");
        onLogin(authinfo);
        fn_success(authinfo);
      } else {
        logger.log("Login failed :-/");
        fn_fail( {
          status: 401
        } );
      }
      return;
    }
    var uri = baseUrl + '/authentication';
    logger.log("Online login. Credentials: auth="+JSON.stringify(auth));
    if (auth.client) {
      uri = baseUrl + '/self/authentication';
    }
    logger.log("user: " + auth.username + ", passwd: " + auth.password);
    uri = uri + "?username=" + auth.username + "&password=" + auth.password;
    logger.log("uri: " + uri);

    authHttp.clearAuthHeader();
    $http.post(uri, {
      'Accept': 'application/json'
    } ).then(function(response) {

      logger.log("Succesful login :-D");
      Cache.clearAll();

      var data = response.data;
      data.password = auth.password;
      Cache.setObject('passwd.' + auth.username, data); 

      onLogin(data);

      fn_success(response);

    }, function(response) {
      fn_fail(response);
    } );
  };

  session.hasRole = function(r) {
    logger.log("Session::hasRole called for :" + r);
    var roles = Cache.get('roles');
    logger.log("Roles:"+roles+",role:"+r);
    if (roles.indexOf(r) >= 0) {
      return true;
    }
    return false;
  };

  session.showByRole = function(r) {
    logger.log("Called showByRole:"+r);
    if (session.hasRole(r)) {
      return "ng-show";
    }
    return "ng-hide";
  };

  session.logout = function() {
    logger.log("Logout attempt");
    authHttp.clearAuthHeader();
    Cache.remove('username');
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

.factory('DataTables', function(authHttp, baseUrl, Settings, Cache, logger) {
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
        logger.log("DTABLE METADATA:" + JSON.stringify(data));
        fn_dtable(data);
      } );
    },
    get: function(name, id, fn_dtable) {
      authHttp.get(baseUrl + '/datatables/' + name + '/' + id).then(function(response) {
        var data = response.data;
        fn_dtable(data);
      } );
    },
    get_one: function(name, id, fn_dtrow, fn_fail) {
      var k = 'dt.' + name + '.' + id;
      var fdata = Cache.getObject(k);
      if (fdata && fdata.length) {
        logger.log("DATATABLE: " + k + " from Cache");
        var fields = fdata[0];
        fn_dtrow(fields, name);
        return;
      }
      authHttp.get(baseUrl + '/datatables/' + name + '/' + id).then(function(response) {
        var data = response.data;
        if (data.length > 0) {
          logger.log("Caching " + k + "::" + JSON.stringify(data));
          fn_dtrow(data[0], name);
        }
        Cache.setObject(k, data);
      }, function(response) {
        if (fn_fail)
          fn_fail(response);
      } );
    },
    update: function(name, id, fields, fn_fields, fn_offline, fn_fail) {
      authHttp.put(baseUrl + '/datatables/' + name + '/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        var k = 'dt.' + name + '.' + id;
        Cache.setObject(k, fields);
        if (202 == response.status) {
          fn_offline(fields);
        } else {
          fn_fields(response.data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    },
    save: function(name, id, fields, fn_fields, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/datatables/' + name + '/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        var k = 'dt.' + name + '.' + id;
        Cache.setObject(k, fields);
        if (202 == response.status) {
          logger.log("Request accepted (server offline)");
          fn_offline(fields);
          return;
        } else {
          logger.log("Create " + name + " success. Got: "
            + JSON.stringify(response.data));
        }
        if (fn_fields !== null) {
          fn_fields(response.data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    },
    saveOffline: function(name, fields, rid) {
      authHttp.saveOffline(baseUrl + '/datatables/' + name + '/', fields, {}, rid);
    }
  };
} )

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
    }
  };
} )

.factory('SACCO_Fields', function() {
  return {
    dateFields: function() { return [ 'joiningDate' ]; },
    saveFields: function() {
      return [ "joiningDate", "Latitude", "Longitude", "Country", "Region", "Zone", "Wereda", "Kebele" ];
    },
    codeFields: function() { return []; },
    skipFields: function() { return {}; }
  };
} )

.factory('Office', function(authHttp, baseUrl, Settings, Cache, HashUtil, logger) {
  return {
    dateFields: function() {
      return ["openingDate"];
    }, // "openingDate"],
    saveFields: function() {
      return ["openingDate", "name", "parentId"];
    },
    codeFields: function() { return []; },
    skipFields: function() { return {} },
    prepareForm: function(office) {
      var sfs = this.saveFields;
      for(var i = 0; i < sfs.length; ++i) {
        var k = sfs[i];
        oField[k] = office[k];
      }
    },
    dataTables: function() {
      return [ "SACCO_Fields" ];
    },
    save: function(fields, fn_office, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/offices', fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
//          logger.log("Create office request accepted");
          var offices = Cache.getObject('h_offices');
          var k = HashUtil.nextKey(offices);
          var new_office = {id: k};
          HashUtil.copy(new_office, fields);
          offices[k] = new_office;
          Cache.setObject('h_offices', offices);
          new_office.cid = response.cid;
          fn_offline(new_office);
          return;
        } else {
          var offices = Cache.getObject('h_offices');
          var new_office = response.data;
          var officeId = new_office.officeId;
          offices[officeId] = new_office;
          Cache.setObject('h_offices', offices);
        }
        logger.log("Create office success. Got: " + JSON.stringify(response.data));
        if (fn_office !== null) {
          fn_office(response.data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    },
    update: function(id, fields, fn_office, fn_offline, fn_fail) {
      authHttp.put(baseUrl + '/offices/' + id, fields, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
          var offices = Cache.getObject('h_offices');
          var office = offices[id];
          if (office) {
            HashUtil.copy(office, fields);
            offices[id] = office;
            logger.log("Offline update office: " + JSON.stringify(office));
          }
          Cache.setObject('h_offices', offices);
          if (fn_offline) {
            fn_offline(office);
          }
          return;
        }
        fn_office(response.data);
      }, function(response) {
        fn_fail(response);
      } );
    },
    get: function(id, fn_office) {
      var offices = Cache.getObject('h_offices') || {};
      if (offices[id]) {
        fn_office(offices[id]);
        return;
      }
      authHttp.get(baseUrl + '/offices/' + id).then(function(response) {
        var odata = response.data;
        fn_office(odata);
      } );
    },
    query: function(fn_offices) {
      var h_offices = Cache.getObject('h_offices') || {};
      var offices = HashUtil.to_a(h_offices);
      if (offices.length) {
        fn_offices(offices);
        return;
      }
      authHttp.get(baseUrl + '/offices').then(function(response) {
        var odata = response.data.sort(function(a, b) { return a.id - b.id } );
        Cache.setObject('h_offices', HashUtil.from_a(odata));
        fn_offices(odata);
      } );
    }
  };
} )

.factory('SACCO', function(Office, Cache, DataTables, DateUtil, HashUtil, logger) {
  return {
    query: function(fn_saccos, fn_sunions) {
      Office.query(function(data) {
        var sunions = [];
        var po = new Object();
        var saccos = [];
        for(var i = 0; i < data.length; ++i) {
          if (data[i].id == 1) {
            continue;
          }
          if (data[i].parentId == 1) {
            sunions.push(data[i]);
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
        if (fn_sunions) {
          fn_sunions(sunions);
        }
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
//        logger.log("No. of SUs: " + sunions.length);
        fn_sunions(sunions);
      } );
    },
    query_full: function(fn_saccos) {
      var h_offices = Cache.getObject('h_offices') || {};
      var offices = HashUtil.to_a(h_offices);
      var get_dtables = function(office) {
        var dts = Office.dataTables();
        for(var i = 0; i < dts.length; ++i) {
          var dt = dts[i];
          var id = office.id;
          var k = 'dt.'+dt+'.'+id;
          var fields = Cache.getObject(k);
          if (fields) {
            office[dt] = fields;
            continue;
          }
          DataTables.get_one(dt, id, function(fields, dt) {
            office[dt] = fields;
            var k = 'dt.'+dt+'.'+id;
            Cache.setObject(k, fields);
          } );
        }
      };
      if (offices.length) {
        for(var i = 0; i < offices.length; ++i) {
          get_dtables(offices[i]);
        }
        fn_saccos(offices);
        return;
      }
      authHttp.get(baseUrl + '/offices').then(function(response) {
        var odata = response.data.sort(function(a, b) { return a.id - b.id } );
        Cache.setObject('h_offices', HashUtil.from_a(odata));
        for(var i = 0; i < odata.length; ++i) {
          get_dtables(odata[i]);
        }
        fn_saccos(odata);
      } );
    },
    get_full: function(id, fn_office) {
      Office.get(id, function(office) {
        office.openingDt = DateUtil.localDate(office.openingDate);
        office.openingDate = DateUtil.isoDate(office.openingDate);
        var dts = Office.dataTables();
        for(var i = 0; i < dts.length; ++i) {
          var dt = dts[i];
          DataTables.get_one(dt, id, function(fields, dt) {
            if (fields && fields.joiningDate != null) {
              if (fields.joiningDate instanceof Array) {
                fields.joiningDt = DateUtil.localDate(fields.joiningDate);
                fields.joiningDate = DateUtil.isoDate(fields.joiningDate);
              } else {
                logger.log("Got joiningDate: " + JSON.stringify(fields.joiningDate));
              }
            }
            office[dt] = fields;
            logger.log("SACCO with " + dt + ": " + JSON.stringify(office));
          } );
        }
        fn_office(office);
      } );
    },
  };
} )

.factory('Staff', function(authHttp, baseUrl, Cache, logger) {
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
        logger.log("Going to cache " + staff.length + "staff.");
        Cache.setObject('staff', staff);
        fn_staff(staff);
      } );
    },
    remove: function(staff){},
    get: function(id, fn_staff) {
      authHttp.get(baseUrl + '/staff/' + id).then(function(response) {
        var sdata = response.data;
        logger.log("Got staff: " + JSON.stringify(sdata));
        fn_staff(sdata);
      } );
    }
  }
} )

.factory('FormHelper', function(DateUtil, logger) {
  return {
    prepareForm: function(type, object) {
      var sfs = type.saveFields().concat(type.dataTables());
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
          object[k] = fn(object);
        } else if (dfHash[k]) { 
          object[k] = DateUtil.isoDate(v);
        } else {
          object[k] = v;
        }
      }
    },
    preSaveForm: function(type, object, isUpdate) {
      if (isUpdate == null) isUpdate = true;
      logger.log("Called FormHelper.preSaveForm with " + JSON.stringify(object));
      var sObject = new Object();
      var skf = type.skipFields();
      var svf = type.saveFields();
      var dfs = type.dateFields();
      var dfHash = new Object();
      for(var i = 0; i < svf.length; ++i) {
        var k = svf[i];
        if (isUpdate && skf && skf[k]) {
          logger.log("Skipping field: " + k);
          continue;
        }
        sObject[k] = object[k];
      }
      if (dfs.length) {
        for(var i = 0; i < dfs.length; ++i) {
          var df = dfs[i];
          var v = sObject[df];
          logger.log("Got date " + df + "=" + v);
          if (v instanceof Date) {
            v = v.toISOString();
          }
          v = v.substr(0, 10);
          logger.log("Got date " + df + "=" + v);
          sObject[df] = v;
        }
        sObject.dateFormat = "yyyy-MM-dd";
        sObject.locale = "en";
      }
      return sObject;
    },
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

.factory('Clients', function(authHttp, baseUrl, Settings, Cache, HashUtil, logger) {
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
        logger.log("Got cached clients: " + typeof(clients));
        if (!HashUtil.isEmpty(clients)) {
          var a_clients = [];
          for(var id in clients) {
            a_clients.push(clients[id]);
          }
          process_clients(a_clients);
          logger.log("Clients.query got "+a_clients.length+" cached clients");
        }
      } else {
        logger.log("Clients.query got no cached clients");
        authHttp.get(baseUrl + '/clients')
        .then(function(response) {
          var data = response.data;
          if (data.totalFilteredRecords) {
            var a_clients = data.pageItems;
            clients = {};
            for(var i = 0; i < a_clients.length; ++i) {
              var c = a_clients[i];
              logger.log("Setting client " + c.id + " = " + JSON.stringify(c));
              clients[c.id] = c;
            }
            Cache.setObject('h_clients', clients);
            logger.log("Got " + a_clients.length + " clients");
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
        logger.log("Clients.get found cached " + typeof(clients));
        var client = clients[id];
        logger.log("Clients.get for: " + id + " :: " + JSON.stringify(client));
        fn_client(client);
      }
    },
    save: function(client, fn_client, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/clients', client, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
          clients = Cache.getObject('h_clients') || {};
          var id = HashUtil.nextKey(clients);
          client["id"] = id;
          clients[id] = client;
          Cache.setObject('h_clients', clients);
          client["cid"] = response.cid;
          fn_offline(client);
        } else {
          clients = Cache.getObject('h_clients') || {};
          logger.log("Created client resp: "+JSON.stringify(response.data));
          var new_client = response.data;
          var id = new_client.resourceId;
          clients[id] = new_client;
          Cache.setObject('h_clients', clients);
          fn_client(new_client);
        }
      }, function(response) {
        logger.log("Client create failed:"+JSON.stringify(response));
        fn_fail(response);
      } );
    },
    update: function(id, client, fn_client, fn_offline, fn_fail) {
      authHttp.put(baseUrl + '/clients/' + id, client, {
        "params": { "tenantIdentifier": Settings.tenant }
      }, function(response) {
        if (202 == response.status) {
          clients = Cache.getObject('h_clients');
          if (clients.hasOwnProperty(id)) {
            var eClient = clients[id];
            eClient["id"] = id;
            HashUtil.copy(eClient, client);
            Cache.setObject('h_clients', clients);
            fn_offline(eClient);
          }
        } else {
          authHttp.get(baseUrl + '/clients/' + id)
            .then(function(response) {
              var data = response.data;
              var id = data.id;
              clients = Cache.getObject('h_clients');
              clients[id] = data;
              Cache.setObject('h_clients', clients);
              logger.log("Reloaded client data: " + JSON.stringify(data));
            }, function(response) {
              logger.log("Failed to reload client #" + id);
            } );
          logger.log("Update client. Response: " + JSON.stringify(response.data));
          fn_client(response.data);
        }
      }, function(response) {
        logger.log("Update failed!. Response status:" + response.status + "; " + JSON.stringify(response.data));
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

.factory('Customers', function(authHttp, baseUrl, Clients, DataTables, logger) {
  return {
    get_full: function(id, fn_customer) {
      Clients.get(id, function(client) {
        var dts = Clients.dataTables();
        for(var i = 0; i < dts.length; ++i) {
          var dt = dts[i];
          logger.log("Client DataTable:" + dt + " for #" + id);
          DataTables.get_one(dt, id, function(fields, dt) {
            client[dt] = fields;
            logger.log("Client #" + id + " " + dt +
              "::" + JSON.stringify(fields));
          } );
        }
        fn_customer(client);
      } );
    },
    query_full: function(fn_customers) {
      Clients.query(function(clients) {
        for(var i = 0; i < clients.length; ++i) {
          var client = clients[i];
          var id = client.id;
          var dts = Clients.dataTables();
          for(var j = 0; j < dts.length; ++j) {
            var dt = dts[j];
            DataTables.get_one(dt, id, function(fields, dt) {
              client[dt] = fields;
            } );
          }
        }
        fn_customers(clients);
      } );
    }
  };
} )

.factory('SelfService', function(authHttp, baseUrl, Cache, logger) {
  return {
    query: function(fn_clients) {
      authHttp.get(baseUrl + '/self/clients').then(function(response) {
        var data = response.data;
        if (data.totalFilteredRecords) {
          var clients = data.pageItems;
          logger.log("Clients found: " + clients.length);
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

.factory('ClientImages', function(authHttp, baseUrl, logger) {
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
        logger.log("Image for client " + id + " received. Size: " + response.data.length);
        fn_img(response.data);
      } );
    },
    getB64: function(id, fn_img) {
      authHttp.get(baseUrl + '/clients/' + id + '/images', {
        'Accept': 'application/octet-stream'
      } ).then(function(response) {
        logger.log("Image for client " + id + " received[b64]. Size: " + response.data.length);
        fn_img(response.data);
      } );
    },
    save: function(id, imgData, fn_success, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/clients/' + id + '/images', imgData, {
        'Content-Type': 'text/plain'
      }, function(response) {
        var data = response.data;
        if (response.status == 202) {
          fn_offline(data);
        } else {
          fn_success(data);
        }
      }, function(response) {
        fn_fail(response);
      } );
    }
  };
} )

.factory('SavingsProducts', function(authHttp, baseUrl, logger) {
  return {
    get: function(id, fn_sav_prod) {
      authHttp.get(baseUrl + '/savingsproducts/' + id)
        .then(function(response) {
          fn_sav_prod(response.data);
        } );
    },
    query: function(fn_sav_prods) {
      authHttp.get(baseUrl + '/savingsproducts')
        .then(function(response) {
          var data = response.data;
          logger.log("SavingsProducts.query got: " + JSON.stringify(data));
          fn_sav_prods(data);
        } );
    }
  }
} )

.factory('SavingsAccounts', function(authHttp, baseUrl, logger) {
  return {
    get: function(accountNo, fn_sac) {
      authHttp.get(baseUrl + '/savingsaccounts/' + accountNo + '?associations=transactions')
        .then(function(response) {
          fn_sac(response.data);
        } );
    },
    query: function(fn_accts) {
      logger.log("SavingsAccounts.query called");
      authHttp.get(baseUrl + '/savingsaccounts')
        .then(function(response) {
          var data = response.data;
          logger.log("Got " + data.totalFilteredRecords + " savings accounts.");
          fn_accts(data.pageItems);
        } );
    },
    save: function(fields, fn_success, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/savingsaccounts', fields, {},
        function(response) {
          var data = response.data;
          if (response.status == 202) {
            fn_offline(data);
          } else {
            fn_success(data);
          }
        },
        function(response) {
          fn_fail(response);
        } );
    },
    withdraw: function(id, params, fn_res, fn_offline, fn_err) {
      authHttp.post(baseUrl + '/savingsaccounts/' + id + '/transactions?command=withdrawal',
        params, {}, function(response) {
          var data = response.data;
          fn_res(data);
        }, function(response) {
          fn_offline(response);
        }, function(response) {
          logger.log("Failed to withdraw. Received " + response.status);
          fn_err(response);
        } );
    },
    deposit: function(id, params, fn_res, fn_offline, fn_err) {
      authHttp.post(baseUrl + '/savingsaccounts/' + id + '/transactions?command=deposit',
        params, {}, function(response) {
          var data = response.data;
          fn_res(data);
        }, function(response) {
          fn_offline(response);
        }, function(response) {
          logger.log("Failed to deposit. Received " + response.status);
          fn_err(response);
        } );
    },
  };
} )

.factory('LoanAccounts', function(authHttp, baseUrl, logger) {
  return {
    get: function(accountNo, fn_account) {
      authHttp.get(baseUrl + '/loans/' + accountNo + '?associations=transactions')
        .then(function(response) {
          fn_account(response.data);
        } );
    },
    query: function(fn_accounts) {
      logger.log("LoanAccounts query called");
      authHttp.get(baseUrl + '/loans')
        .then(function(response) {
          var data = response.data;
          fn_accounts(data.pageItems);
        } );
    },
    repay: function(id, params, fn_res, fn_offline, fn_err) {
      authHttp.post(baseUrl + '/loans/' + id + '?command=repayment')
        .then(function(response) {
          if (202 == response.status) {
            fn_offline(response);
            return;
          }
          fn_res(response.data);
        }, function(response) {
          fn_err(response);
        } );
    },
    retrieveLoanDetails: function(id, fn_account) {
      authHttp.get(baseUrl + '/loans/template/' + '?templateType=individual&clientId='+id)
        .then(function(response) {
          fn_account(response.data);
        } );
    },
    retrieveLoanDetailsViaProductID: function(id,productID,fn_account) {
      authHttp.get(baseUrl + '/loans/template/' + '?templateType=individual&clientId='+id + '&productId=' +productID)
        .then(function(response) {
          fn_account(response.data);
        } );
    },
    createLoan: function(createLoanData, fn_success, fn_offline, fn_fail) {
      authHttp.post(baseUrl + '/loans', createLoanData, {},
        function(response) {
          var data = response.data;
          if (response.status == 202) {
            fn_offline(data);
          } else {
            fn_success(data);
          }
        },
        function(response) {
          fn_fail(response);
        } );
    }
  };
} )

.factory('Shares', function(authHttp, baseUrl) {
  return {
    url: baseUrl + '/account/share',
    get: function(clientId, fn_shares) {
      logger.log("Shares called for:"+clientId);
    },
    query: function(fn_shares) {
      logger.log("Shares called");
    },
    save: function(sfields, fn_shares, fn_offline, fn_fail) {
      authHttp.post(this.url, sfields, {},
        function(response) {
          logger.log("Successfully created share");
          var share = response.data;
          if (response.status == 202) {
            fn_offline(response);
            return;
          }
          fn_shares(share);
        },
        function(err_resp) {
          logger.log("Failed to create shares");
        } );
    },
    update: function(id, sfields, fn_shares, fn_offline, fn_fail) {
      authHttp.put(this.url + id, sfields, {}, function(response) {
        if (202 == response.status) {
          fn_offline(response);
          return;
        }
        logger.log("share update success");
        fn_shares(response.data);
      }, function(response) {
        logger.log("share update fail");
      } );
    }
  };
} )

.factory('Codes', function(authHttp, baseUrl, Cache, logger) {
  var codeNames = {
    "Gender": 4,
    "ClientClassification": 17,
    "Relationship": 26
  };

  var codesObj = {
    getValues: function(codename, fn_codevalues) {
      var codevalues = Cache.getObject('codevalues.' + codename) || {};
      if (codevalues.length) {
        fn_codevalues(codevalues);
      } else {
        var code = codeNames[codename];
        authHttp.get(baseUrl + '/codes/' + code + '/codevalues')
          .then(function(response) {
            var codeValues = response.data;
            logger.log("Got code response: " + JSON.stringify(codeValues));
            Cache.setObject('codevalues.' + codename, codeValues);
            fn_codevalues(codeValues);
          }, function(response) {
            logger.log("Failed to get codes:" + response.status);
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

.factory('MifosEntity', function(authHttp, DataTables) {
  var obj;

  return {
    init: function(config) {
      obj.name = config.name;
      var dataTables = config.dataTables;
      angular.forEach(dataTables, function(dt) {
        obj[dt] = config[dt];
      } );
      obj.fields = config.fields;
      obj.skipFields = config.skipFields;
    },
    get: function(id, fn_success, fn_fail) {
    },
    query: function(id, fn_success, fn_fail) {
    },
    update: function(id, fields, fn_success, fn_offline, fn_fail) {
    },
    save: function(fields, fn_success, fn_offline, fn_fail) {
    }
  };
} )

;

