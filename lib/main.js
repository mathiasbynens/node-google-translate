var _               = require('underscore'),
    request         = require('request'),
    querystring     = require('querystring');


var apiBase = 'https://www.googleapis.com/language/translate/v2/';

module.exports = function(apiKey) {

  ////
  //  PROCESS API CALLS
  ////

  // Create options object for request
  var createRequestOptions = function(path, data) {
    var qs = _.extend({
      'key': apiKey,
    }, data);

    console.log(path)
    console.log(data)

    return {
      uri: root + path,
      qs: qs,
    };
  };

  // Handle callback from request
  var responseHandler = function(cb) {
    return function(err, res, body) {
      if (!cb) return;
      
      // Catch connection errors
      if (err || !res) {
        var returnErr = 'Error connecting to Google';
        if (err) returnErr += ': ' + err.code;
        err = returnErr;
      } else if (res.statusCode !== 200) {
        err = 'Something went wrong. Google responded with a ' + res.statusCode;
      }
      if (err) return cb(err, null);
 
      // Catch parse error
      try {
        body = JSON.parse(body);
      } catch(e) {
        err = 'Could not parse response from Google: ' + body;
        return cb(err, null);
      }

      // Return response
      cb(null, body);
    };
  };

  // Get shortcut
  var get  = function(path, data, cb) { request.get(createRequestOptions(path, data), cb); };


  var api = {};

  ////
  //   TRANSLATE API
  ////

  api.translation = function(data, cb) {

  };

  ////
  //   GET SUPPORTED LANGUAGES
  ////

  api.getAvailableLanguages = function(data, cb) {

  };

  
  ////
  //   DETECT SOURCE LANGUAGE
  ////

  api.detectSource = function(data, cb) {
    
  };


  // Return api
  return {
    translation:              api.translation,
    getAvailableLanguages:    api.getAvailableLanguages,
    detectSource:             api.detectSource
  };

};
