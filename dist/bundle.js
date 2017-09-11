module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.default = build;
	/* eslint no-use-before-define: [1, 'nofunc'] */

	function uniqueId(objectName, id) {
	  if (!id) {
	    return null;
	  }

	  return '' + objectName + id;
	}

	function buildRelationship(reducer, target, relationship, options, cache) {
	  var ignoreLinks = options.ignoreLinks,
	      parentTree = options.parentTree;

	  var rel = target.relationships[relationship];

	  if (typeof rel.data !== 'undefined') {
	    if (Array.isArray(rel.data)) {
	      return rel.data.map(function (child) {
	        if (parentTree.indexOf(child.type) !== -1) {
	          return child;
	        }
	        return build(reducer, child.type, child.id, options, cache) || child;
	      });
	    } else if (rel.data === null || parentTree.indexOf(rel.data.type) !== -1) {
	      return rel.data;
	    }
	    return build(reducer, rel.data.type, rel.data.id, options, cache) || rel.data;
	  } else if (!ignoreLinks && rel.links) {
	    throw new Error('Remote lazy loading is not supported (see: https://github.com/yury-dymov/json-api-normalizer/issues/2). To disable this error, include option \'ignoreLinks: true\' in the build function like so: build(reducer, type, id, { ignoreLinks: true })');
	  }

	  return [];
	}

	function build(reducer, objectName) {
	  var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
	  var providedOpts = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	  var cache = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

	  var defOpts = { eager: false, ignoreLinks: false, parentTree: [], includeType: false };
	  var options = _extends({}, defOpts, providedOpts);
	  var eager = options.eager,
	      includeType = options.includeType;


	  if (!reducer[objectName]) {
	    return null;
	  }

	  if (id === null || Array.isArray(id)) {
	    var idList = id || Object.keys(reducer[objectName]);

	    return idList.map(function (e) {
	      return build(reducer, objectName, e, options, cache);
	    });
	  }

	  var ids = id.toString();
	  var uuid = uniqueId(objectName, ids);
	  var cachedObject = cache[uuid];

	  if (cachedObject) {
	    return cachedObject;
	  }

	  var ret = {};
	  var target = reducer[objectName][ids];

	  if (!target) {
	    return null;
	  }

	  if (target.id) {
	    ret.id = target.id;
	  }

	  Object.keys(target.attributes).forEach(function (key) {
	    ret[key] = target.attributes[key];
	  });

	  if (includeType && !ret.type) {
	    ret.type = objectName;
	  }

	  cache[uuid] = ret;

	  if (target.relationships) {
	    Object.keys(target.relationships).forEach(function (relationship) {
	      if (eager) {
	        var relOptions = _extends({}, options);
	        relOptions.parentTree = [].concat(options.parentTree);
	        relOptions.parentTree.push(objectName);
	        ret[relationship] = buildRelationship(reducer, target, relationship, relOptions, cache);
	      } else {
	        Object.defineProperty(ret, relationship, {
	          get: function get() {
	            var field = '__' + relationship;

	            if (ret[field]) {
	              return ret[field];
	            }

	            ret[field] = buildRelationship(reducer, target, relationship, options, cache);

	            return ret[field];
	          }
	        });
	      }
	    });
	  }

	  if (typeof ret.id === 'undefined') {
	    ret.id = ids;
	  }

	  return ret;
	}

/***/ })
/******/ ]);