var request = require("request");
var prompt = require('prompt');
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

prompt.start();

console.log("Enter arguments");

var productId, clientId;

prompt.get(['productId', 'clientId'], function(err, result) {
  if (err) { console.log("Error") }
  createSaving(result);
} );

function setSubmitted(data, date) {
  var dt = date.toISOString().substr(0,10);
  console.log("Date: " + dt);
  data['submittedOnDate'] = dt;
  data['locale'] = 'en';
  data['dateFormat'] = 'yyyy-MM-dd';
}

function createSaving(data) {
  setSubmitted(data, new Date());

  var body = JSON.stringify(data);
  console.log("POST request Body:" + body);

  request( {
    url: baseUrl + "/savingsaccounts",
    headers: headers,
    method: 'POST',
    body: body
  }, function(error, response, body) {
    if (error) {
      console.log("Error: " + error);
    } else {
      console.log("Success!");
      console.log(body);
    }
  } );
}
