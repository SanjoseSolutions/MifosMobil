var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var accountId = process.argv[2];

request( {
  url: baseUrl + "/loans/" + accountId + "/charges",
  headers: headers,
}, function(error, response, body) {
  if (error) {
    console.log("Error: " + error);
  } else {
    if (!(body instanceof Object)) {
      body = JSON.parse(body);
    }
    console.log(JSON.stringify(body, null, 4));
  }
} );

