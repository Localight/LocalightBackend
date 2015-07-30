var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    SessionService = require('../services/sessions.js'),
    Location = mongoose.model('Location');

/* Create a Location */
router.post('/', function(req, res, next) {
    //Check if required was sent
    if (!(req.body.name &&
            req.body.triconKey &&
            req.body.address1 &&
            req.body.sessionToken)) {
        return res.json({
            msg: "You must provide all required fields!",
            errorid: "994"
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId) {
        new Location({
            name: req.body.name,
            triconKey: req.body.triconKey,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state: req.body.state,
            zipcode: req.body.zipcode,
            ownerId: accountId
        }).save(function(err, location) {
            if (err) {
                console.log("Error saving location to DB!");
                res.json({
                    msg: "Error saving location to DB!",
                    errorid: "666"
                });
            } else {
                res.json({status: 200});
            }
        });
    });
});

/* Get all Locations */
router.get('/', function(req, res, next) {
    Location.find({})
    .select('name address1 address2 city state zipcode')
    .exec(function(err, locations) {
        if(err){
            return res.json({msg: "Couldn't query the database for locations!",
                    errorid: "779"});
        } else {
            res.json(locations);
        }
    });
});

/* Get a Location by id */
router.get('/:id', function(req, res, next) {
    Location.findOne({_id: req.params.id})
    .select('name address1 address2 city state zipcode')
    .exec(function(err, locations) {
        if(err){
            return res.json({msg: "Couldn't query the database for locations!",
                    errorid: "779"});
        } else {
            res.json(locations);
        }
    });
});

/* Update a Location */
router.put('/:id', function(req, res, next) {
    //Logic goes here
});

/* Delete a Location */
router.delete('/:id', function(req, res, next) {
    //Logic goes here
});

/* Make a purchase at a location */
router.post('/:id/spend', function(req, res, next) {
    //Logic goes here
});

module.exports = router;
