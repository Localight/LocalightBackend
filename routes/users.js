var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    SessionService = require('../services/sessions.js'),
    User = mongoose.model('User');

/* User Login */
router.post('/login', function(req, res, next) {
    //Find a user with the username requested. Select salt and password
      User.findOne({ phone : req.body.phone })
      .select('password salt _id')
      .exec(function(err, user) {
          if(err){
              res.json({msg: "Couldn't search the database for user!",
                      status: 500});
          } else if(!user){
              res.json({msg: "Username does not exist!",
                      status: 401});
          } else {
              if(!req.body.password || !req.body.phone){
                  res.json({msg: "You must provide a phone and password!",
                          status: 412});
              } else {
                  //Hash the requested password and salt
                  var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);
                  //Compare to stored hash
                  if(hash == user.password){
                      SessionService.generateSession(user._id, "user", function(err, token){
                          if(err){
                              res.json(err);
                          } else {
                              //All good, give the user their token
                              res.json({token: token, 200});
                          }
                      });
                  } else {
                      res.json({msg: "Password is incorrect!",
                              status: 401});
                  }
              }
          }
      });
});

/* User Join Through Twilio */
router.post('/twilio', function(req, res, next) {
    //Trim phone number
    var phone = req.body.From.substring(2);
    if(req.body.Body == "Gift"){
        //Check if a user with that username already exists
        User.findOne({ phone : phone })
        .select('_id')
        .exec(function(err, user) {
            if(user){
                SessionService.generateSession(user._id, "user", function(err, token){
                    if(err){
                        res.json(err);
                    } else {
                        //All good, give the user their token
                        res.send('<Response><Message>http://lbgift.com/#/giftcards/create/' + token + '</Message></Response>');
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
                      SessionService.generateSession(user._id, "user", function(err, token){
                          if(err){
                              res.json(err);
                          } else {
                              //All good, give the user their token
                              res.send('<Response><Message>http://lbgift.com/#/giftcards/create/' + token + '</Message></Response>');
                          }
                      });
                  }
              });
          }
        });
    }
});

/* Reset Password */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Update a user */
router.put('/', function(req, res, next) {
    SessionService.validateSession(req.body.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            var updatedUser = {};

            if (req.body.name && typeof req.body.name === 'string') updatedUser.name = req.body.name;
            if (req.body.email && typeof req.body.email === 'string') updatedUser.email = req.body.email;
            if (req.body.password && typeof req.body.password === 'string'){
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                updatedUser.password = hash;
                updatedUser.salt = salt;
            }
            updatedUser.updated = Date.now();

            var setUser = { $set: updatedUser }

            User.update({_id:accountId}, setUser)
            .exec(function(err, user){
                if(err){
                    res.json({msg: "Could not update user",
                            status: 500});
                } else {
                    user.status = 200;
                    res.json(user);
                }
            })
        }
    });
});

/* Get a user */
router.get('/', function(req, res, next) {
    SessionService.validateSession(req.query.sessionToken, "user", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            User.findOne({ _id: accountId })
            .select('name email phone created updated')
            .exec(function(err, user) {
                if(err){
                    res.json({msg: "Couldn't search the database for user!",
                            status: 500});
                } else if(!user){
                    res.json({msg: "User does not exist!",
                            404});
                } else {
                    res.json(user);
                }
            });
        }
    });
});

/* Delete a user */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
