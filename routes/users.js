var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    crypto = require('crypto'),
    Session = mongoose.model('Session'),
    User = mongoose.model('User');

/* User Join */
router.post('/join', function(req, res, next) {
    //Check if a user with that username already exists
      User.findOne({ phone : req.body.phone })
      .select('_id')
      .exec(function(err, user) {
          if(user){
              res.json({msg: "Username already exists!",
                      errorid: "22"});
          } else {
              if(!req.body.phone){
                  res.json({msg: "You must provide a username and password!",
                          errorid: "994"});
              } else {
                  var password = req.body.password;
                  if(!req.body.password){
                      password = "";
                  }
                  //Create a random salt
                  var salt = crypto.randomBytes(128).toString('base64');
                  //Create a unique hash from the provided password and salt
                  var hash = crypto.pbkdf2Sync(password, salt, 10000, 512);
                  //Create a new user with the assembled information
                  var user = new User({
                      name: req.body.name,
                      email: req.body.email,
                      phone: req.body.phone,
                      password: hash,
                      salt: salt
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
                                  token: token
                              }).save(function(err){
                                  if(err){
                                      console.log("Error saving token to DB!");
                                      res.json({msg: "Error saving token to DB!",
                                              errorid: "667"});
                                  } else {
                                      //All good, give the user their token
                                      res.json({token: token});
                                  }
                              });
                      }
                  });
              }
          }
      });
});

/* User Login */
router.post('/login', function(req, res, next) {
    //Find a user with the username requested. Select salt and password
      User.findOne({ phone : req.body.phone })
      .select('password salt')
      .exec(function(err, user) {
          if(err){
              res.json({msg: "Couldn't search the database for user!",
                      errorid: "777"});
          } else if(!user){
              res.json({msg: "Username does not exist!",
                      errorid: "23"});
          } else {
              if(!req.body.password || !req.body.phone){
                  res.json({msg: "You must provide a username and password!",
                          errorid: "994"});
              } else {
                  //Hash the requested password and salt
                  var hash = crypto.pbkdf2Sync(req.body.password, user.salt, 10000, 512);
                  //Compare to stored hash
                  if(hash == user.password){
                      //Create a random token
                      var token = crypto.randomBytes(48).toString('hex');
                      //New session!
                      new Session(
                          {
                              accountId: user._id,
                              token: token
                          }).save(function(err){
                              if(err){
                                  console.log("Error saving token to DB!");
                                  res.json({msg: "Error saving token to DB!",
                                          errorid: "667"});
                              } else {
                                  //All good, give the user their token
                                  res.json({token: token});
                              }
                          });
                  } else {
                      res.json({msg: "Password is incorrect!",
                              errorid: "32"});
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
                //Create a random token
                var token = crypto.randomBytes(48).toString('hex');
                //New session!
                new Session({
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
    }
});

/* Reset Password */
router.post('/reset', function(req, res, next) {
  //Logic goes here
});

/* Update a user */
router.put('/', function(req, res, next) {
    //Find a session with the specified session token. Get the account id.
    Session.findOne({ token : req.body.sessionToken })
    .select('accountId')
    .exec(function(err, session) {
        if(err){
          return res.json({msg: "Couldn't search the database for session!",
                  errorid: "779"});
        } else if(!session){
          return res.json({msg: "Session is not valid!",
                  errorid: "34"});
        } else {
            var updatedUser = {};

            if (req.body.name) updatedUser.name = req.body.name;
            if (req.body.email) updatedUser.email = req.body.email;
            if (req.body.password){
                //Create a random salt
                var salt = crypto.randomBytes(128).toString('base64');
                //Create a unique hash from the provided password and salt
                var hash = crypto.pbkdf2Sync(req.body.password, salt, 10000, 512);
                updatedUser.password = hash;
                updatedUser.salt = salt;
            }
            updatedUser.updated = Date.now();

            var setUser = { $set: updatedUser }

            User.update({_id:session.accountId}, setUser)
            .exec(function(err, user){
                if(err){
                    res.json(err);
                } else {
                    res.json(user);
                }
            })
        }
    });
});

/* Get a user */
router.get('/:id', function(req, res, next) {
  //Logic goes here
});

/* Delete a user */
router.delete('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
