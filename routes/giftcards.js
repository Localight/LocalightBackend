var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    giftcard = mongoose.model('giftcard');

/* Giftcard routes. */
router.get('/', function(req, res, next) {
  res.send('Respond with giftcard stuff');
});

module.exports = router;
