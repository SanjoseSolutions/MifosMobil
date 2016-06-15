var request = require('request');
var baseUrl = 'https://demo.openmf.org/fineract-provider/api/v1';
var cred = process.argv[2];
var clientId = process.argv[3];
var url = baseUrl + '/clients/' + clientId + '/accounts?fields=shareAccounts';
function getAuthHeader(cred) {
  var encoded = new Buffer(cred).toString('base64');
  var hdr = 'Basic ' + encoded;
  console.log("Got header: " + hdr);
  return hdr;
}
var Authorization = getAuthHeader(cred);

request( {
  url: url,
  headers: {
    Authorization: Authorization,
    'Fineract-Platform-TenantId': 'default'
  }
}, function(err, response, body) {
  if (err) {
    console.log("Error: " + err);
    return;
  }
  var data = JSON.parse(body);
  console.log(JSON.stringify(data, null, 2));
} );

