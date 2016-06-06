var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var argv = process.argv;
var url = baseUrl + '/staff';
if (argv.length >= 3) {
  url = url + '/' + argv[2];
}

request( {
  url: url,
  headers: headers,
}, function(error, response, body) {
  if (error) {
    console.error("Error: " + error);
  } else {
    if (!(body instanceof Object)) {
      var data = JSON.parse(body);
      var oHash = {};
      data.forEach(function(staff) {
        oHash[staff.officeId] = true;
        console.log("Office: " + staff.officeId + ", Staff: " + staff.displayName);
      } );
      request( {
        url: baseUrl + '/clients',
        headers: headers
      }, function(error, response, body) {
        if (error) {
          console.error("Error: " + error);
        } else {
          console.log("Clients");
          var data = JSON.parse(response.body);
          data.pageItems.forEach(function(client) {
            var officeId = client.officeId;
            if (oHash[officeId]) {
              console.log("O#" + officeId + " #" + client.id + ": " + client.displayName);
            }
          } );
        }
      } );
    }
  }
} );

