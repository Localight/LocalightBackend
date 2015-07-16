var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    user = mongoose.model('user');

/* User routes */
router.get('/', function(req, res, next) {
  res.send('Respond with user stuff');
});

module.exports = router;
