var _               = require('underscore'),
    request         = require('request'),
    querystring     = require('querystring'),
    async           = require('async');

// TODO Make queries between 2-5k POST instead of GET

var apiBase = 'https://www.googleapis.com/language/translate/v2/',
    maxGetQueryLen = 1600;

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

    // Split into multiple calls if query is longer than allowed by Google
    var queries;    
    if (Array.isArray(strings) && encodeURIComponent(strings.join(',')).length > maxGetQueryLen && strings.length !== 1) {
      var stringSets = [];
      splitArraysForGoogle(strings, stringSets);
    } else {
      stringSets = [strings];
    }

    // Compile data
    var data = { target: targetLang };
    if (sourceLang) data.source = sourceLang;

    // Run queries async
    async.map(stringSets, function(stringSet, done) {

      get('', _.extend({ q: stringSet }, data), parseTranslations(stringSet, done));

    }, function(err, translations) {
      if (err) return cb(err);

      // Merge and return translation
      cb(null, _.flatten(translations));
    });

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
  
  api.detectLanguage = function(strings, cb) {
    if (!cb) return console.log('No callback defined');
    if (typeof strings !== 'string' && !Array.isArray(strings)) return cb('Input source must be a string or array of strings');

    // Split into multiple calls if query is longer than allowed by Google
    var queries;
    if (Array.isArray(strings) && encodeURIComponent(strings.join(',')).length > maxGetQueryLen && strings.length !== 1) {
      var stringSets = [];
      splitArraysForGoogle(strings, stringSets);
    } else {
      stringSets = [strings];
    }

    // Run queries async
    async.map(stringSets, function(stringSet, done) {

      get('detect', {q: stringSet}, parseLanguageDetections(stringSet, done));

    }, function(err, detections) {
      if (err) return cb(err);

      // Merge and return detections
      cb(null, _.flatten(detections));
    });

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

  var parseTranslations = function(originalStrings, done) {
    return function(err, data) {
      if (err) return done(err, null);
      
      // Remove nesting
      data = data.data;
      data = data.translations ? data.translations : data;

      // Add originalText to response
      originalStrings.forEach(function(s, index){ 
        if (data[index]) _.extend(data[index], { originalText: s });
      });

      // Return nested languages array
      done(null, data);
    };
  };

  var parseAvailableLanguages = function(cb) {
    return function(err, data) {
      if (err) return cb(err, null);
      cb(null, data.data.languages);
    }
  };

  var parseLanguageDetections = function(originalStrings, done) {
    return function(err, data) {
      if (err) return done(err, null);

      // Remove nesting and parse
      data = data.data && data.data.detections ? data.data.detections : data;
      if (data.length > 1) {
        data = data.map(function(d){ return d[0]; });
      } else {
        data = data[0];
      }

      // Add originalText to response
      originalStrings.forEach(function(s, index){ 
        if (data[index]) _.extend(data[index], { originalText: s });
      });

      done(null, data);
    };
  };


  ////
  //  HELPERS
  ////

  // Return array of arrays that are short enough for Google to handle
  var splitArraysForGoogle = function(arr, result) {
    if (encodeURIComponent(arr.join(',')).length > maxGetQueryLen && arr.length !== 1) {
      var mid = Math.floor(arr.length / 2);
      splitArraysForGoogle(arr.slice(0,mid), result);
      splitArraysForGoogle(arr.slice(mid, arr.length), result);
    } else {
      result.push(arr)
    }
  };


  ////
  //   RETURN API
  ////

  return {
    translate:                api.translate,
    getAvailableLanguages:    api.getAvailableLanguages,
    detectLanguage:             api.detectLanguage
  };

};

