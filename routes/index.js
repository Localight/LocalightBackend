var express = require('express');
var router = express.Router();

//This file should be left alone.
//Will be unused, perhaps removed later.

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(404).send("Not found");
});

module.exports = router;
