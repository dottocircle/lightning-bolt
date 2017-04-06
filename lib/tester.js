'use strict';

class Tester {

  _toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  }

  jsonNotContains(jsonBody, jsonTest) {
    // Check each matching key/val
    // console.log(jsonTest);
    if (typeof jsonTest !== 'object') {
      throw new TypeError(`Expected valid JavaScript object to be given, got ` + typeof expected);
    }

    // Type check first to prevent potentially confusing errors
    let aType = this._toType(jsonBody);
    let eType = this._toType(jsonTest);
    // Function is not a valid JSON type
    if (eType === 'function') {
      eType = this._toType(jsonTest.prototype);
    }
    if (aType !== eType) {
      throw new Error(`Expected '` + aType + `' to be type '` + eType + `' for comparison`);
    }
    let errorKeys = [];
    for (let key in jsonTest) {
      if (jsonTest.hasOwnProperty(key)) {
        // console.log(key);
        // Ensure property exists
        if (jsonBody) {
          let kt = typeof jsonTest[key];
          if (kt === 'object') {
            // NESTED expectJSON
            this.jsonNotContains(jsonBody[key], jsonTest[key]);
            continue;
          } else if (kt === 'function') {
            let keyType = jsonTest[key].prototype;

            // User-supplied callback (anonymous function)
            if (this._toType(keyType) === 'object') {
              // Custom matcher function
              let res = jsonTest[key].call(this, jsonBody[key]);
              if (typeof res === 'boolean') {
                if (res !== true) {
                  throw new Error(`Expected callback function on key '` + key + `' to return true`);
                }
              }
              // Don't do any further assertions for user
              continue;
            }
          } else if (kt !== 'undefined') {
            // Jasmine 'toMatch' matcher
            let test = (jsonBody[key] === jsonTest[key]);
            if (test) {
              throw new Error(`Expected ` + this._toType(jsonBody[key]) +
                ` '` + jsonBody[key] + `' not to match ` +
                this._toType(jsonTest[key]) + ` '` +
                jsonTest[key] + `' on key '` + key + `'`);
            }
          }

          // Do an assertion so assertion count will be consistent
          expect(false).toBeFalsy();
        } else {
          errorKeys.push(key);
        }
      }
    }

    if (errorKeys.length > 0) {
      throw new Error(`Keys ['` + errorKeys.join(`', '`) + `'] not present in JSON Response body`);
    }

    return true;
  }

}

module.exports = Tester;
