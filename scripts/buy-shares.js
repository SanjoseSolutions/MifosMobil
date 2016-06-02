var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var argv = process.argv;
if (argv.length < 5) {
  console.error("Usage: " + argv.join(" ") + " clientId savingsAccountId numShares");
  return;
}

var clientId = argv[2];
var savingsAccountId = argv[3];
var shares = argv[4];

var date = new Date();
var dt = date.toISOString().substr(0,10);

var req = {
  productId: 2,
  unitPrice: 5,
  savingsAccountId: savingsAccountId,
  submittedDate: dt,
  applicationDate: dt,
  requestedShares: shares,
  locale: 'en',
  dateFormat: 'yyyy-MM-dd',
  charges: [],
  clientId: clientId
};

var body = JSON.stringify(req);

request( {
  url: baseUrl + '/accounts/share',
  headers: headers,
  method: 'POST',
  body: body
}, function(err, response, body) {
  if (err) {
    console.error("Error: " + err);
  } else {
    console.log(body);
  }
} );
