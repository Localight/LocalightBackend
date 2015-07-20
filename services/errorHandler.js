'use strict';

/**
 * Get unqiue error field name
 */

 var getUniqueErrorMessage = function(err) {
 	var output;

 	try {
 		var fieldName = err.err.substring(err.err.lastIndexOf('.$') + 2, err.err.lastIndexOf('_1'));
 		output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' already exists';

 	} catch (ex) {
 		output = 'Unique field already exists';
 	}

 	return output;
 };

/**
 * Get teh error message from error Object
 */

exports.getUniqueErrorMessage = function(err){
   var message = '';
   if (err.code) {
      switch(err.code){
         case 11000:
         case 11001:
         message = getUniqueErrorMessage(err);
         break;
         default:
         message = 'Shit your pants! Something went wrong';
      }
   } else {
      for( var errName in err.errors){
         if (err.errors[errName].message) message = err.errors[errName].message;
      }
   }
   return message;
};
