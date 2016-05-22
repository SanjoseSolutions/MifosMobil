var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

var productId, clientId, officerId;

clientId = process.argv[2];
productId = process.argv[3];
officerId = process.argv[4];

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

var data = {
  clientId: clientId,
  productId: productId,
  fieldOfficerId: officerId
};

createSaving(data);

