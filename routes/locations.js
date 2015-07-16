var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    location = mongoose.model('location');

/* Location routes */
router.get('/', function(req, res, next) {
  res.send('Respond with location stuff');
});

module.exports = router;
