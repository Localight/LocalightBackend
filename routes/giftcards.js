var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Giftcard = mongoose.model('Giftcard');

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
