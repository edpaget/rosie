_ = require('underscore/underscore');

var Factory = function(constructor) {
  this.construct = constructor;
  this.attrs = {};
  this.sequences = {};
  this.funcs = {};
};

Factory.prototype = {
  value_or_function: function(value) {
    return (typeof value == 'function') ? value : function() {
      return value;
    };
  },

  attr: function(attr, value) {
    this.attrs[attr] = this.value_or_function(value);
    return this;
  },

  set_attrs: function(hash) {
    for (var key in hash) {
      if (hash.hasOwnProperty(key)) {
        this.attr(key, hash[key]);
      }
    }

    return this;
  },

  func: function(func_name, value) {
    this.funcs[func_name] = this.value_or_function(value);
    return this;
  },

  set_funcs: function(hash) {
    for (var key in hash) {
      if (hash.hasOwnProperty(key)) {
        this.func(key, hash[key]);
      }
    }
    return this;
  },

  sequence: function(attr, callback) {
    var factory = this;
    callback = callback || function(i) {
      return i;
    };
    this.attrs[attr] = function() {
      factory.sequences[attr] = factory.sequences[attr] || 0;
      return callback(++factory.sequences[attr]);
    };
    return this;
  },

  attributes: function(attrs) {
    attrs = attrs || {};
    for (var attr in this.attrs) {
      if (!attrs.hasOwnProperty(attr)) {
        attrs[attr] = this.attrs[attr]();
      }
    }
    return attrs;
  },

  functions: function() {
    var funcs = {};
    for (var func in this.funcs) {
      if (!funcs.hasOwnProperty(func)) {
        funcs[func] = this.funcs[func];
      }
    }
    return funcs;
  },
  after_create: function(callback) {
    if (!this.hasOwnProperty('postHooks')) {
      this.postHooks = [];
    }
    this.postHooks.push(callback);
  },
  run_post_hooks: function(result, callback) {
    if (!this.hasOwnProperty('postHooks')) {
      this.postHooks = [];
    }
    this.postHooks.push(callback);
    if (this.postHooks.length > 0) {
      current = this.postHooks.shift();
      next = this.postHooks.shift();

      if (next === null || next === undefined) {
        next = result;
      }
    }
    return current.call(result, next);

  },
  build: function(attrs, callback) {
    var result = this.construct ? new this.construct() : {};
    result = _.extend(result, this.attributes(attrs));
    result = _.extend(result, this.functions());
    if (callback !== null && callback !== undefined) {
      this.run_post_hooks(result, callback);
    }
    return result;
  }
};

Factory.factories = {};

Factory.define = function(name, constructor) {
  var factory = new Factory(constructor);
  this.factories[name] = factory;
  return factory;
};

Factory.build = function(name, attrs, callback) {
  return this.factories[name].build(attrs, callback);
};

Factory.attributes = function(name, attrs) {
  return this.factories[name].attributes(attrs);
};

module.exports = Factory;
