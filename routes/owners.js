var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    owner = mongoose.model('owner');

/* Owner routes */
router.get('/', function(req, res, next) {
  res.send('Respond with owner stuff');
});

module.exports = router;
