Google Translate API for Node
=====================

A Node.js module for working with the [Google Translate API](https://developers.google.com/translate/v2/using_rest). 

Makes multiple concurrent API calls when input exceeds Google's maximum query length.

Installation
----------

Install via [npm](http://npmjs.org/)

    npm install google-translate --save

USAGE
----------

**Require**

    var googleTranslate = require('google-translate')(apiKey);

If you don't have an API key, [get one here](https://developers.google.com/translate/v2/pricing).
  
*Note*: All callbacks are passed an error and data argument: `callback(err, data)`.

  
  
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
