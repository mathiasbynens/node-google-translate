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

    return {
      url: apiBase + path,
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
  var get  = function(path, data, cb) { request.get(createRequestOptions(path, data), responseHandler(cb)); };
  
  var api = {};

  ////
  //   TRANSLATE API
  ////

  // TODO send as post if over 5k
  // TODO support array of strings
  api.translate = function(string, sourceLang, targetLang, cb) {
    if (typeof string !== 'string') return cb('Input must be a string');
    if (typeof sourceLang !== 'string') return cb('No target language specified. Must be a string');

    // Make sourceLang optional
    if (!cb) {
      cb = targetLang;
      targetLang = sourceLang;
      sourceLang = null;
    }
    if (!cb) return console.log('No callback defined');    

    // Compile data
    var data = {
      q: string,
      target: targetLang
    };
    if (sourceLang) data.source = sourceLang;

    get('', data, function(err, data) {
      if (err) return cb(err, null);
      
      // Carefully remove nesting
      data = data.data;
      data = data.translations ? data.translations : data;
      if (data.length === 1) data = data[0];

      // Return nested languages array
      cb(null, data);
    });

  };


  ////
  //   GET SUPPORTED LANGUAGES
  ////

  api.getAvailableLanguages = function(data, cb) {
    // Data param is optional
    if (typeof data === 'function') {
      cb = data;
      data = {};
    }
    if (!cb) return console.log('No callback defined');

    get('languages', data, function(err, data) {
      if (err) return cb(err, null);

      // Return nested languages array
      cb(null, data.data.languages);
    });
  };

  
  ////
  //   DETECT SOURCE LANGUAGE
  ////

  // TODO send as post if over 5k
  // TODO support array of strings
  api.detectSource = function(data, cb) {
    if (!cb) return console.log('No callback defined');
    if (typeof data !== 'string') return cb('Input source must be a string');

    get('detect', {q: data}, function(err, data) {
      if (err) return cb(err, null);

      // Carefully remove nesting
      data = data.data;
      data = data.detections ? data.detections : data;
      data = data[0] ? data[0] : data;
      data = data[0] ? data[0] : data;

      cb(null, data);
    });
  };


  // Return api
  return {
    translate:                api.translate,
    getAvailableLanguages:    api.getAvailableLanguages,
    detectSource:             api.detectSource
  };

};
