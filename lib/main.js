var _               = require('underscore'),
    request         = require('request'),
    querystring     = require('querystring');


var apiBase = 'https://www.googleapis.com/language/translate/v2/';

module.exports = function(apiKey) {

  ////
  //  SEND REQUEST
  ////

  var get  = function(path, data, cb) {
    var url = apiBase + path + '?' + querystring.stringify(_.extend({ 'key': apiKey }, data));
    request.get(url, globalResponseHandler(cb)); 
  };
  

  ////
  //   API ENDPOINTS
  ////

  var api = {};

  // TODO send as post if over 5k
  api.translate = function(strings, sourceLang, targetLang, cb) {
    if (typeof strings !== 'string' && !Array.isArray(strings)) return cb('Input source must be a string or array of strings');
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
      q: strings,
      target: targetLang
    };
    if (sourceLang) data.source = sourceLang;

    get('', data, parseTranslations(cb));
  };


  api.getAvailableLanguages = function(data, cb) {
    // Data param is optional
    if (typeof data === 'function') {
      cb = data;
      data = {};
    }
    if (!cb) return console.log('No callback defined');

    get('languages', data, parseAvailableLanguages(cb));
  };
  
  // TODO send as post if over 5k
  api.detectSource = function(data, cb) {
    if (!cb) return console.log('No callback defined');
    if (typeof data !== 'string' && !Array.isArray(data)) return cb('Input source must be a string or array of strings');

    get('detect', {q: data}, parseSourceDetections(cb));
  };



  ////
  //   RESPONSE HANDLERS
  ////

  var globalResponseHandler = function(cb) {
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

  var parseTranslations = function(cb) {
    return function(err, data) {
      if (err) return cb(err, null);
      
      // Carefully remove nesting
      data = data.data;
      data = data.translations ? data.translations : data;
      if (data.length === 1) data = data[0];

      // Return nested languages array
      cb(null, data);
    };
  };

  var parseAvailableLanguages = function(cb) {
    return function(err, data) {
      if (err) return cb(err, null);
      cb(null, data.data.languages);
    }
  };

  var parseSourceDetections = function(cb) {
    return function(err, data) {
      if (err) return cb(err, null);

      // Remove nesting and parse
      data = data.data && data.data.detections ? data.data.detections : data;
      if (data.length > 1) {
        data = data.map(function(d){
          return d[0];
        });
      } else {
        data = data[0][0];
      }

      cb(null, data);
    };
  };


  ////
  //   RETURN API
  ////

  return {
    translate:                api.translate,
    getAvailableLanguages:    api.getAvailableLanguages,
    detectSource:             api.detectSource
  };

};

