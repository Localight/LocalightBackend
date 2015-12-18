var request = require('request');

//Checks if a token exists, and returns the corrosponding accountId
exports.create = function(url, callback) {
    console.log("Url submitted: " + url);
    request.post({
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            url: 'http://lbgift.com/submit.php',
            body: "url=" + url
        },
        function(err, response, body) {
            if (err) {
                console.log("problem accessing url shortner");
            } else if (!body || body == null) {
                console.log("Error generating url. Error: 1, Response: " + JSON.parse(response));
            } else if (!JSON.parse(body).url) {
                console.log("Error generating url. Error: 2, Response: " + response);
            } else {
                callback(JSON.parse(body).url);
            }
        });


};
