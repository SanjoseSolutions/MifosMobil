var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var argv = process.argv;
if (argv.length < 3) {
  console.error("Usage: " + argv.join(" ") + " clientId");
  return;
}

var clientId = argv[2];

var atype = argv[3], suf = '';

if (atype) {
  suf = '?fields=' + atype;
}

request( {
  url: baseUrl + "/clients/" + clientId + "/accounts" + suf,
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

