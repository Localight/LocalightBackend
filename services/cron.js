var express = require('express'),
    GiftcardService = require('../services/giftcards.js');

exports.start = function() {
    console.log("CronManager: Manager has started!")

    //3 hours, 60 minutes, 60 seconds, 1000 milliseconds
    sendGiftcardsInterval = 3 * 60 * 60 * 1000;
    setInterval(function() {
        console.log("CronManager: GiftcardService.sendCurrent() has just started!");
        GiftcardService.sendCurrent(function(err) {
            console.log("CronManager: GiftcardService.sendCurrent() results:");
            console.log(err);
        });

    }, sendGiftcardsInterval);
}
