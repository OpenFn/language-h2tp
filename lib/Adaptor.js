"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.execute = execute;
exports.get = get;
exports.post = post;
exports.put = put;
exports.patch = patch;
exports.del = del;
exports.parseXML = parseXML;
exports.parseCSV = parseCSV;
exports.request = request;
Object.defineProperty(exports, "fn", {
  enumerable: true,
  get: function () {
    return _languageCommon.fn;
  }
});
Object.defineProperty(exports, "alterState", {
  enumerable: true,
  get: function () {
    return _languageCommon.alterState;
  }
});
Object.defineProperty(exports, "dataPath", {
  enumerable: true,
  get: function () {
    return _languageCommon.dataPath;
  }
});
Object.defineProperty(exports, "dataValue", {
  enumerable: true,
  get: function () {
    return _languageCommon.dataValue;
  }
});
Object.defineProperty(exports, "each", {
  enumerable: true,
  get: function () {
    return _languageCommon.each;
  }
});
Object.defineProperty(exports, "field", {
  enumerable: true,
  get: function () {
    return _languageCommon.field;
  }
});
Object.defineProperty(exports, "fields", {
  enumerable: true,
  get: function () {
    return _languageCommon.fields;
  }
});
Object.defineProperty(exports, "http", {
  enumerable: true,
  get: function () {
    return _languageCommon.http;
  }
});
Object.defineProperty(exports, "lastReferenceValue", {
  enumerable: true,
  get: function () {
    return _languageCommon.lastReferenceValue;
  }
});
Object.defineProperty(exports, "merge", {
  enumerable: true,
  get: function () {
    return _languageCommon.merge;
  }
});
Object.defineProperty(exports, "sourceValue", {
  enumerable: true,
  get: function () {
    return _languageCommon.sourceValue;
  }
});
Object.defineProperty(exports, "combine", {
  enumerable: true,
  get: function () {
    return _languageCommon.combine;
  }
});

var _Utils = require("./Utils");

var _languageCommon = require("@openfn/language-common");

var _request = _interopRequireDefault(require("request"));

var _cheerio = _interopRequireDefault(require("cheerio"));

var _cheerioTableparser = _interopRequireDefault(require("cheerio-tableparser"));

var _fs = _interopRequireDefault(require("fs"));

var _csvParse = _interopRequireDefault(require("csv-parse"));

var _toughCookie = _interopRequireDefault(require("tough-cookie"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module Adaptor */
const {
  axios
} = _languageCommon.http;
exports.axios = axios;
/**
 * Execute a sequence of operations.
 * Wraps `language-common/execute`, and prepends initial state for http.
 * @example
 * execute(
 *   create('foo'),
 *   delete('bar')
 * )(state)
 * @constructor
 * @param {Operations} operations - Operations to be performed.
 * @returns {Operation}
 */

function execute(...operations) {
  const initialState = {
    references: [],
    data: null
  };
  return state => {
    return (0, _languageCommon.execute)(...operations)({ ...initialState,
      ...state
    });
  };
}

var cookiejar = new _toughCookie.default.CookieJar();
var Cookie = _toughCookie.default.Cookie;
axios.interceptors.request.use(config => {
  cookiejar === null || cookiejar === void 0 ? void 0 : cookiejar.getCookies(config.url, (err, cookies) => {
    config.headers.cookie = cookies === null || cookies === void 0 ? void 0 : cookies.join('; ');
  });
  return config;
});

function handleCookies(response) {
  const {
    config,
    data,
    headers
  } = response;

  if (config.keepCookie) {
    let cookies;
    let keepCookies = [];

    if (headers['set-cookie']) {
      var _headers$setCookie2;

      if (headers['set-cookie'] instanceof Array) {
        var _headers$setCookie;

        cookies = (_headers$setCookie = headers['set-cookie']) === null || _headers$setCookie === void 0 ? void 0 : _headers$setCookie.map(Cookie.parse);
      } else {
        cookies = [Cookie.parse(headers['set-cookie'])];
      }

      (_headers$setCookie2 = headers['set-cookie']) === null || _headers$setCookie2 === void 0 ? void 0 : _headers$setCookie2.forEach(c => {
        cookiejar.setCookie(Cookie.parse(c), config.url, (err, cookie) => {
          keepCookies === null || keepCookies === void 0 ? void 0 : keepCookies.push(cookie === null || cookie === void 0 ? void 0 : cookie.cookieString());
        });
      });
    }

    const extendableData = Array.isArray(data) ? {
      body: data
    } : data;
    return { ...response,
      data: { ...extendableData,
        __cookie: (keepCookies === null || keepCookies === void 0 ? void 0 : keepCookies.length) === 1 ? keepCookies[0] : keepCookies,
        __headers: response.headers
      }
    };
  }

  return response;
}

function handleResponse(state, response) {
  console.log(response.config.method.toUpperCase(), 'request succeeded with', response.status, '✓');
  const compatibleResp = { ...response,
    httpStatus: response.status,
    message: response.statusText,
    data: (0, _Utils.tryJson)(response.data)
  };
  const respWithCookies = handleCookies(compatibleResp);
  return { ...(0, _languageCommon.composeNextState)(state, respWithCookies.data),
    response: respWithCookies
  };
}

function handleCallback(state, callback) {
  if (callback) return callback(state);
  return state;
}
/**
 * Make a GET request
 * @public
 * @example
 *  get("/myendpoint", {
 *      query: {foo: "bar", a: 1},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"}
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @constructor
 * @param {string} path - Path to resource
 * @param {object} params - Query, Headers and Authentication parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function get(path, params, callback) {
  return state => {
    var _params$authenticatio, _params, _params2;

    path = (0, _languageCommon.expandReferences)(path)(state);
    params = _languageCommon.http.expandRequestReferences(params)(state);
    const url = (0, _Utils.setUrl)(state.configuration, path);
    const auth = (0, _Utils.setAuth)(state.configuration, (_params$authenticatio = (_params = params) === null || _params === void 0 ? void 0 : _params.authentication) !== null && _params$authenticatio !== void 0 ? _params$authenticatio : (_params2 = params) === null || _params2 === void 0 ? void 0 : _params2.auth);
    const config = (0, _Utils.mapToAxiosConfig)({ ...params,
      url,
      auth
    });
    return _languageCommon.http.get(config)(state).then(response => handleResponse(state, response)).then(nextState => handleCallback(nextState, callback));
  };
}
/**
 * Make a POST request
 * @public
 * @example
 *  post("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @constructor
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Authentication parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {operation}
 */


function post(path, params, callback) {
  return state => {
    var _params$authenticatio2, _params3, _params4;

    path = (0, _languageCommon.expandReferences)(path)(state);
    params = _languageCommon.http.expandRequestReferences(params)(state);
    const url = (0, _Utils.setUrl)(state.configuration, path);
    const auth = (0, _Utils.setAuth)(state.configuration, (_params$authenticatio2 = (_params3 = params) === null || _params3 === void 0 ? void 0 : _params3.authentication) !== null && _params$authenticatio2 !== void 0 ? _params$authenticatio2 : (_params4 = params) === null || _params4 === void 0 ? void 0 : _params4.auth);
    const config = (0, _Utils.mapToAxiosConfig)({ ...params,
      url,
      auth
    });
    return _languageCommon.http.post(config)(state).then(response => handleResponse(state, response)).then(nextState => handleCallback(nextState, callback));
  };
}
/**
 * Make a PUT request
 * @public
 * @example
 *  put("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @constructor
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function put(path, params, callback) {
  return state => {
    var _params$authenticatio3, _params5, _params6;

    path = (0, _languageCommon.expandReferences)(path)(state);
    params = _languageCommon.http.expandRequestReferences(params)(state);
    const url = (0, _Utils.setUrl)(state.configuration, path);
    const auth = (0, _Utils.setAuth)(state.configuration, (_params$authenticatio3 = (_params5 = params) === null || _params5 === void 0 ? void 0 : _params5.authentication) !== null && _params$authenticatio3 !== void 0 ? _params$authenticatio3 : (_params6 = params) === null || _params6 === void 0 ? void 0 : _params6.auth);
    const config = (0, _Utils.mapToAxiosConfig)({ ...params,
      url,
      auth
    });
    return _languageCommon.http.put(config)(state).then(response => handleResponse(state, response)).then(nextState => handleCallback(nextState, callback));
  };
}
/**
 * Make a PATCH request
 * @public
 * @example
 *  patch("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @constructor
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function patch(path, params, callback) {
  return state => {
    var _params$authenticatio4, _params7, _params8;

    path = (0, _languageCommon.expandReferences)(path)(state);
    params = _languageCommon.http.expandRequestReferences(params)(state);
    const url = (0, _Utils.setUrl)(state.configuration, path);
    const auth = (0, _Utils.setAuth)(state.configuration, (_params$authenticatio4 = (_params7 = params) === null || _params7 === void 0 ? void 0 : _params7.authentication) !== null && _params$authenticatio4 !== void 0 ? _params$authenticatio4 : (_params8 = params) === null || _params8 === void 0 ? void 0 : _params8.auth);
    const config = (0, _Utils.mapToAxiosConfig)({ ...params,
      url,
      auth
    });
    return _languageCommon.http.patch(config)(state).then(response => handleResponse(state, response)).then(nextState => handleCallback(nextState, callback));
  };
}
/**
 * Make a DELETE request
 * @public
 * @example
 *  del("/myendpoint", {
 *      body: {"foo": "bar"},
 *      headers: {"content-type": "application/json"},
 *      authentication: {username: "user", password: "pass"},
 *    },
 *    function(state) {
 *      return state;
 *    }
 *  )
 * @constructor
 * @param {string} path - Path to resource
 * @param {object} params - Body, Query, Headers and Auth parameters
 * @param {function} callback - (Optional) Callback function
 * @returns {Operation}
 */


function del(path, params, callback) {
  return state => {
    var _params$authenticatio5, _params9, _params10;

    path = (0, _languageCommon.expandReferences)(path)(state);
    params = _languageCommon.http.expandRequestReferences(params)(state);
    const url = (0, _Utils.setUrl)(state.configuration, path);
    const auth = (0, _Utils.setAuth)(state.configuration, (_params$authenticatio5 = (_params9 = params) === null || _params9 === void 0 ? void 0 : _params9.authentication) !== null && _params$authenticatio5 !== void 0 ? _params$authenticatio5 : (_params10 = params) === null || _params10 === void 0 ? void 0 : _params10.auth);
    const config = (0, _Utils.mapToAxiosConfig)({ ...params,
      url,
      auth
    });
    return _languageCommon.http.delete(config)(state).then(response => handleResponse(state, response)).then(nextState => handleCallback(nextState, callback));
  };
}
/**
 * Parse XML with the Cheerio parser
 * @public
 * @example
 *  parseXML(body, function($){
 *    return $("table[class=your_table]").parsetable(true, true, true);
 *  })
 * @constructor
 * @param {String} body - data string to be parsed
 * @param {function} script - script for extracting data
 * @returns {Operation}
 */


function parseXML(body, script) {
  return state => {
    const $ = _cheerio.default.load(body);

    (0, _cheerioTableparser.default)($);

    if (script) {
      const result = script($);

      try {
        const r = JSON.parse(result);
        return (0, _languageCommon.composeNextState)(state, r);
      } catch (e) {
        return (0, _languageCommon.composeNextState)(state, {
          body: result
        });
      }
    } else {
      return (0, _languageCommon.composeNextState)(state, {
        body: body
      });
    }
  };
}
/**
 * CSV-Parse for CSV conversion to JSON
 * @public
 * @example
 *  parseCSV("/home/user/someData.csv", {
 * 	  quoteChar: '"',
 * 	  header: false,
 * 	});
 * @constructor
 * @param {String} target - string or local file with CSV data
 * @param {Object} config - csv-parse config object
 * @returns {Operation}
 */


function parseCSV(target, config) {
  return state => {
    return new Promise((resolve, reject) => {
      var csvData = [];

      try {
        _fs.default.readFileSync(target);

        _fs.default.createReadStream(target).pipe((0, _csvParse.default)(config)).on('data', csvrow => {
          console.log(csvrow);
          csvData.push(csvrow);
        }).on('end', () => {
          console.log(csvData);
          resolve((0, _languageCommon.composeNextState)(state, csvData));
        });
      } catch (err) {
        var csvString;

        if (typeof target === 'string') {
          csvString = target;
        } else {
          csvString = (0, _languageCommon.expandReferences)(target)(state);
        }

        csvData = (0, _csvParse.default)(csvString, config, (err, output) => {
          console.log(output);
          resolve((0, _languageCommon.composeNextState)(state, output));
        });
      }
    });
  };
}
/**
 * Make a request using the 'request' node module. This module is deprecated.
 * @example
 *  request(params);
 * @constructor
 * @param {object} params - Query, Headers and Authentication parameters
 * @returns {Operation}
 */


function request(params) {
  return state => {
    params = _languageCommon.http.expandRequestReferences(params)(state);
    return new Promise((resolve, reject) => {
      (0, _request.default)(params, (error, response, body) => {
        error = (0, _Utils.assembleError)({
          error,
          response,
          params
        });
        error && reject(error);
        console.log('✓ Request succeeded. (The response body available in state.)');
        const resp = (0, _Utils.tryJson)(body);
        resolve(resp);
      });
    });
  };
}