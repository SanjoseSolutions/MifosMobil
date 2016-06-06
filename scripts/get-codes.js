var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var argv = process.argv;
var url = baseUrl + '/codes';
if (argv.length >= 3) {
  url = url + '/' + argv[2] + '/codevalues';
}

request( {
  url: url,
  headers: headers,
}, function(error, response, body) {
  if (error) {
    console.error("Error: " + error);
  } else {
    if (!(body instanceof Object)) {
      body = JSON.parse(body);
    }
    console.log(JSON.stringify(body, null, 4));
  }
} );

