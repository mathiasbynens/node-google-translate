Google Translate API for Node
=====================

A Node.js module for working with the [Google Translate API](https://developers.google.com/translate/v2/using_rest). 

Makes multiple concurrent API calls when input exceeds Google's maximum query length.

Installation
----------

Install via [npm](http://npmjs.org/)

    npm install google-translate --save

Initialize with your API key ([get one](https://developers.google.com/translate/v2/pricing)).
  
    var googleTranslate = require('google-translate')(apiKey);


# Usage

**Callbacks**: All methods take a callback as their last parameter. Upon method completion, callbacks are passed an error if exists (otherwise null), followed by a response object or array: `callback(err, data)`.

**Bulk translations**:  Passing an array of strings greater than 2k characters will be result in multiple concurrent asynchronous calls. Once all calls are completed, the response will be parsed, merged, and  passed to the callback.

### Translate

    translate(strings, source, target, callback)
    
* **strings**: Required. Can be a string or an array of strings
* **source**: Optional. Google will autodetect the source locale if not specified. [Available languages](https://developers.google.com/translate/v2/using_rest#target)
* **target**:  Required. Language to translate to. [Available languages](https://developers.google.com/translate/v2/using_rest#target)
* **callback**:  Required.

*Example*: Translate a string to German (de) and autodetect source language

    googleTranslate.translate('Hello', 'de', function(err, translation){
      console.log(translation);
      // =>  { translatedText: 'Hallo', originalText: 'Hello', detectedSourceLanguage: 'en' }
    });

*Example*: Translate an array of English (en) strings to German (de)

    googleTranslate.translate(['Hello', 'Thank you'], 'en', 'de', function(err, translations){
      console.log(translations);
      // =>  [{ translatedText: 'Hallo', originalText: 'Hello' }, ...]
    });
  
### Detect language

    detectLanguage(strings, callback)
    
* **strings**: Required. Can be a string or an array of strings
* **callback**:  Required.
 
*Example*: Detect language from a string

    googleTranslate.detectLanguage('Hello', function(err, detection){
      console.log(detection);
      // =>  { language: "en", isReliable: false, confidence: 0.5714286, originalText: "Hello" }
    });

*Example*: Detect language from an array of strings

    googleTranslate.detectLanguage(['Hello', 'Danke'], function(err, detections){
      console.log(detections);
      // =>  [{ language: "en", isReliable: false, confidence: 0.5714286, originalText: "Hello" }, ...]
    });


### Get available language

    getAvailableLanguages(target, callback)
    
* **target**: Optional. If specified, response will include the name of the language translated to the specified target language
* **callback**:  Required.

*Example*: Get all available language codes

    googleTranslate.getAvailableLanguages(function(err, languageCodes){
      console.log(languageCodes);
      // => ['af', 'ar', 'be', 'bg', 'ca', 'cs', ...]
    });
    
*Example*: Get all available language codes with language names in German

    googleTranslate.getAvailableLanguages('de', function(err, languageCodes){
      console.log(languageCodes);
      // => [{ language: "en", name: "Englisch" }, ...]
    });

  
Contribute
----------

Forks and pull requests welcome!

TODO
----------
* Make POST instead of GET requests when query is greater than 2k. Limit for POST is 5k
* Add tests
* Design a better way of defining API keys to allow use of multiple Google Translate API keys

Author
----------

Brandon Paton. Email me if you have any questions: [bp@brandonpaton.com](mailto:bp@brandonpaton.com).
