var request = require("request");
var baseUrl = "https://kifiya.openmf.org/fineract-provider/api/v1";
var headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': 'kifiya',
    'Authorization': 'Basic bWlmb3M6a2Z0ZWNoMTIz'
};

function getAccount(accountId) {
  request( {
    url: baseUrl + "/savingsaccounts/" + accountId + '?associations=transactions',
    headers: headers,
  }, function(error, response, body) {
    if (error) {
      console.log("Error: " + error);
    } else {
      console.log("Success!");
      if (!(body instanceof Object)) {
        var data = JSON.parse(body);
        var trans = data.transactions;
        console.log("Transactions: " + JSON.stringify(trans,null,2));
      }
//      console.log(JSON.stringify(body, null, 4));
    }
  } );
}

accountId = process.argv[2];
getAccount(accountId);

