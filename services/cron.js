var express = require('express'),
    GiftcardService = require('../services/sessions.js');

exports.start = function(){

    //3 hours, 60 minutes, 60 seconds, 1000 milliseconds
    sendGiftcardsInterval = 3 * 60 * 60 * 1000;
    setInterval(function(){
        console.log("CronTask: GiftcardService.sendCurrent() has just started!");
        GiftcardService.sendCurrent(function(err){
            console.log("CronTask: GiftcardService.sendCurrent() results: " + err);
        });

    }, sendGiftcardsInterval);
}
