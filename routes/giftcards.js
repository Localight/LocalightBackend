var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    giftcard = mongoose.model('giftcard');

/* Create a giftcard */
router.post('/', function(req, res, next) {
  //Logic goes here
});

/* Get a giftcard */
router.get('/', function(req, res, next) {
  //Logic goes here
});

/* Update a giftcard */
router.put('/:id', function(req, res, next) {
  //Logic goes here
});

module.exports = router;
