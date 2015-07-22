var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    Session = mongoose.model('Session'),
    User = mongoose.model('User');

/* User Join */
router.post('/join', function(req, res, next) {
  //Logic goes here
});

/* User Login */
router.post('/login', function(req, res, next) {
  //Logic goes here
});

/* User Join Through Twilio */
router.post('/twilio', function(req, res, next) {
    //Trim phone number
    var phone = req.body.From.substring(2);
    //Check if a user with that username already exists
    User.findOne({ phone : phone })
    .select('_id')
    .exec(function(err, user) {
        if(user){
            //Create a random token
            var token = crypto.randomBytes(48).toString('hex');
            //New session!
            new Session({
                    user_id: user._id,
                    token: token
                }).save(function(err){
                    if(err){
                        console.log("Error saving token to DB!");
                        res.json({msg: "Error saving token to DB!",
                                errorid: "667", rawerr: err});
                    } else {
                        //All good, give the user their token
                        res.send('<Response><Message>http://lbgift.com/#!/giftcards/create/' + token + '</Message></Response>');
                    }
                });
      } else {
          //Create a new user with the assembled information
          var user = new User({
              phone: phone
          }).save(function(err, user){
              if(err){
                  console.log("Error saving user to DB!");
                  res.json({msg: "Error saving user to DB!",
                          errorid: "666"});
              } else {
                  //Create a random token
                  var token = crypto.randomBytes(48).toString('hex');
                  //New session!
                  new Session(
                      {
                          accountId: user._id,
                          type: 'user',
                          token: token
                      }).save(function(err){
                          if(err){
                              console.log("Error saving token to DB!");
                              res.json({msg: "Error saving token to DB!",
                                      errorid: "667", rawerr: err});
                          } else {
                              //All good, give the user their token
                              res.send('<Response><Message>http://lbgift.com/#!/giftcards/create/' + token + '</Message></Response>');
                          }
                      });
              }
          });
      }
    });
});

/* Reset Password */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Get a user */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Update a user */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

/* Delete a user */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
