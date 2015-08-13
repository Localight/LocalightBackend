'use strict';
var mongoose = require('mongoose');

/**
 * Module Dependencies
 */

var Location = new mongoose.Schema({
    //NOTE: not sure which fields should be require and which shouldn't. In theory all the fields should be required, because they are all needed for a complete address.
    name: {
        type: String,
        require: 'Please provide the name of the location'
    },
    triconKey: {
        type: String,
        require: 'Please provide the tricon key of the location'
    },
    address1: {
        type: String,
        require: 'Please provide the address of the business'
    },
    address2: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    zipcode: {
        //NOTE: not sure if it should be a string or number
        //NOTE: should add in validation later, for length
        type: String,
    },
    ownerId: {
        type: String,
        ref: 'Owner',
        require: 'please proivde an owner for the business.'
    },
    //NOTE: for business to be more precise later on consider added in geo location, around here somewhere.
});

mongoose.model('Location', Location);
