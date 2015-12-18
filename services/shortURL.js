var request = require('request');

//Checks if a token exists, and returns the corrosponding accountId
exports.create = function(url, callback) {
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
                console.log("Error generating url. Error 1");
            } else if (!JSON.parse(body).url) {
                console.log("Error generating url. Error 2");
            } else {
                callback(JSON.parse(body).url);
            }
        });


};
