'use strict';

/**
 * Module Dependencies
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UserSchema = new Schema({
   name:{
     type:String,
     require:'please enter a name for the user.'
   },
   email:{
     type:String,
     trim:true,
     default: '',
     match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
   phone:{
     type: String,
     trim: true,
     unique: 'testing error message',
     match: [/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/, 'Please fill a valid ten-digit phone number'], // should match the format of a string phonenumber
    required: 'Please fill in a mobile number'
  },
  password:{
    type:String,
    default:'',
   },
  salt:{
   type:String
   },
  created:{
    type:Date,
    default:Date.now
  }
});
mongoose.model('User', UserSchema);
