var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    giftcard = mongoose.model('giftcard');

/* Create a giftcard */
router.post('/giftcards', function(req, res, next) {
  //Logic goes here
});

/* Update a giftcard */
router.put('/giftcards/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
