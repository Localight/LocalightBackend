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
            status: 412
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId) {
        if(err){
            res.json(err);
        } else {
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
                        status: 500
                    });
                } else {
                    res.json({status: 201});
                }
            });
        }
    });
});

/* Get all Locations */
router.get('/', function(req, res, next) {
    Location.find({})
    .select('_id name address1 address2 city state zipcode')
    .exec(function(err, locations) {
        if(err){
            return res.json({msg: "Couldn't query the database for locations!",
                    status: 500});
        } else {
            locations.status = 200;
            res.json(locations);
        }
    });
});

/* Get a Location by id */
router.get('/:id', function(req, res, next) {
    Location.findOne({_id: req.params.id})
    .select('_id name address1 address2 city state zipcode')
    .exec(function(err, locations) {
        if(err){
            return res.json({msg: "Couldn't query the database for locations!",
                    status: 500});
        } else {
            locations.status = 200;
            res.json(locations);
        }
    });
});

/* Update a Location */
router.put('/:id', function(req, res, next) {
    //Check if required was sent
    if (!req.body.sessionToken) {
        return res.json({
            msg: "You must provide all required fields!",
            status: 412
        });
    }
    SessionService.validateSession(req.body.sessionToken, "owner", function(err, accountId){
        if(err){
            res.json(err);
        } else {
            var updatedLocation = {};

            if (req.body.name && typeof req.body.name === 'string') updatedLocation.name = req.body.name;
            if (req.body.address1 && typeof req.body.address1 === 'string') updatedLocation.address1 = req.body.address1;
            if (req.body.address2 && typeof req.body.address2 === 'string') updatedLocation.address2 = req.body.address2;
            if (req.body.city && typeof req.body.city === 'string') updatedLocation.city = req.body.city;
            if (req.body.state && typeof req.body.state === 'string') updatedLocation.state = req.body.state;
            if (req.body.zipcode && typeof req.body.zipcode === 'string') updatedLocation.zipcode = req.body.zipcode;

            var setLocation = { $set: updatedLocation }

            Location.update({_id: req.params.id, ownerId: accountId}, setLocation)
            .exec(function(err, location){
                if(err){
                    res.json(err);
                } else {
                    res.json({status: 200});
                }
            })
        }
    });
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
