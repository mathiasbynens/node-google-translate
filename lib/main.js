var _               = require('underscore'),
    request         = require('request'),
    querystring     = require('querystring'),
    async           = require('async'),
    entities        = require('he');

// Globals
var apiBase = 'https://www.googleapis.com/language/translate/v2/',
    maxGetQueryLen = 1600, // Limit is actually 2000, but let's just be safe
    concurrentLimit = 10; // Max num concurrent requests. Can be overridden by passing a new limit when requiring module

////
//  SEND REQUEST
////

// Closure that returns a function for making a
// GET request to Google with an apiKey
var getRequestWithApi = function(apiKey) {
  return function(path, data, cb) {
    var url = apiBase + path + '?' + querystring.stringify(_.extend({ 'key': apiKey }, data));
    request.get(url, globalResponseHandler(cb));
  };
};

////
//   RESPONSE HANDLERS
////

var globalResponseHandler = function(cb) {
  return function(err, res, body) {
    if (!cb || !_.isFunction(cb)) return;

    // Catch connection errors
    if (err || !res) {
      var returnErr = 'Error connecting to Google';
      if (err) returnErr += ': ' + err.code;
      err = returnErr;
    } else if (res.statusCode !== 200) {
      err = 'Something went wrong. Google responded with a ' + res.statusCode;
    }
    if (err) return cb(err, null);

    // Try to parse response
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
    originalStrings.forEach(function(s, i){
      if (data[i]) _.extend(data[i], { originalText: s });
    });

    // Decode html entities
    data = data.map(function(translation){
      translation.translatedText = entities.decode(translation.translatedText);
      return translation;
    });

    // Return nested languages array
    done(null, data);
  };
};

var parseSupportedLanguages = function(cb) {
  return function(err, languages) {
    if (err) return cb(err, null);
    languages = languages.data.languages;;
    if (languages[0] && !languages[0].name) languages = _.pluck(languages, 'language');
    cb(null, languages);
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
    originalStrings.forEach(function(s, i){
      if (data[i]) _.extend(data[i], { originalText: s });
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
//   PUBLIC API
////

module.exports = function(apiKey, newConcurrentLimit) {

  // Set new concurrent limit for async calls if specified
  concurrentLimit = newConcurrentLimit || concurrentLimit;

  var get = getRequestWithApi(apiKey),
      api = {};


  // TRANSLATE

  api.translate = function(strings, sourceLang, targetLang, cb) {
    if (typeof strings !== 'string' && !Array.isArray(strings)) return cb('Input source must be a string or array of strings');
    if (typeof sourceLang !== 'string') return cb('No target language specified. Must be a string');

    // Make sourceLang optional
    if (!cb) {
      cb = targetLang;
      targetLang = sourceLang;
      sourceLang = null;
    }
    if (!_.isFunction(cb)) return console.log('No callback defined');

    // Split into multiple calls if string array is longer than allowed by Google (2k limit for GET, 5k for POST)
    var queries;
    if (Array.isArray(strings) && encodeURIComponent(strings.join(',')).length > maxGetQueryLen && strings.length !== 1) {
      var stringSets = [];
      splitArraysForGoogle(strings, stringSets);
    } else if (!Array.isArray(strings)) {
      stringSets = [[strings]];
    } else {
      stringSets = [strings];
    }

    // Request options
    var data = { target: targetLang };
    if (sourceLang) data.source = sourceLang;

    // Run queries async
    // TODO Make POST requests when query is greater than 2k. More efficient -- limit for POST is 5k, compared to 2k for GET
    async.mapLimit(stringSets, concurrentLimit, function(stringSet, done) {

      get('', _.extend({ q: stringSet }, data), parseTranslations(stringSet, done));

    }, function(err, translations) {
      if (err) return cb(err);

      // Merge and return translation
      translations = _.flatten(translations);
      if (translations.length === 1) translations = translations[0];
      cb(null, translations);
    });

  };


  // GET SUPPORTED LANGUAGES

  api.getSupportedLanguages = function(target, cb) {
    // Data param is optional
    if (_.isFunction(target)) {
      cb = target;
      target = {};
    } else {
      target = { target: target };
    }
    if (!_.isFunction(cb)) return console.log('No callback defined');

    get('languages', target, parseSupportedLanguages(cb));
  };


  // DETECT LANGUAGES

  api.detectLanguage = function(strings, cb) {
    if (!cb) return console.log('No callback defined');
    if (typeof strings !== 'string' && !Array.isArray(strings)) return cb('Input source must be a string or array of strings');

    // Split into multiple calls if string array is longer than allowed by Google (2k limit for GET, 5k for POST)
    var queries;
    if (Array.isArray(strings) && encodeURIComponent(strings.join(',')).length > maxGetQueryLen && strings.length !== 1) {
      var stringSets = [];
      splitArraysForGoogle(strings, stringSets);
    } else if (!Array.isArray(strings)) {
      stringSets = [[strings]];
    } else {
      stringSets = [strings];
    }

    // Run queries async
    // TODO Make POST requests when query is greater than 2k. More efficient -- limit for POST is 5k, compared to 2k for GET
    async.mapLimit(stringSets, concurrentLimit, function(stringSet, done) {

      get('detect', { q: stringSet }, parseLanguageDetections(stringSet, done));

    }, function(err, detections) {
      if (err) return cb(err);

      // Merge arrays and return detections
      detections = _.flatten(detections);
      if (detections.length === 1) detections = detections[0];
      cb(null, detections);

    });

  };

  ////
  //   RETURN API
  ////

  return {
    translate:                api.translate,
    getSupportedLanguages:    api.getSupportedLanguages,
    detectLanguage:           api.detectLanguage
  };

};


