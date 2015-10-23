var request = require('request');

//Checks if a token exists, and returns the corrosponding accountId
exports.create = function(url, callback) {
    request.post({
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            url: 'http://s.julianjp.com/submit.php',
            body: "url=" + url
        },
        function(err, response, body) {
            if(err){
                console.log("problem accessing url shortner");
            } else {
                callback(JSON.parse(body));
            }
        });


};