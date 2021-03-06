'use strict';

const debug = require('debug')('koa-legit:Field');
const sanitizers = require('./sanitizers');
const validators = require('./validators');
const { toString } = require('./utils');


/**
 * Field
 */
class Field {
  /**
   * Create a new Field instance.
   *
   * @param {string} name - The field name.
   * @param {string} value - The data value of the field as string.
   * @param {string} [message=null] - The default message of the field validation.
   */
  constructor(name, value, message = null) {
    debug('create an instance');
    this.name = name;
    this.value = value;
    this.text = toString(value);
    this.message = message;
    this.options = {
      optional: false
    };

    this.validators = [];
    this.sanitizers = [];

    // TODO: Pre-define before constructor
    for (const [fnName, fn] of Object.entries(validators)) {
      Field.prototype[fnName] = (params = [], options = {}) => {
        if (typeof params === 'string')
          options = { message: params };
        else if (!Array.isArray(params))
          options = params || {};
        else if (typeof options === 'string')
          options = { message: options };

        params = Array.isArray(params) ? params : [];
        const {
          message = null, negated = false
        } = options;

        const validator = x => {
          if (fn(x, ...params) === negated)
            throw new Error(message || this.message);
        };
        this.validators.push(validator);
        return this;
      };
    }

    for (const [fnName, fn] of Object.entries(sanitizers)) {
      Field.prototype[fnName] = (params = []) => {
        const sanitizer = x => fn(x, ...params);
        this.sanitizers.push(sanitizer);
        return this;
      };
    }
  }

  // TODO: Refactor later
  exists(options = {}) {
    if (typeof options === 'string')
      options = { message: options };
    const { message = null, negated = false } = options;
    const validator = () => {
      if ((typeof this.value !== 'undefined') === negated)
        throw new Error(message || this.message);
    };
    this.validators.push(validator);
    return this;
  }

  /**
   * Set the field as optional. Ignore all validation rules if the field data
   * is undefined.
   *
   * @return {Field} The instance on which this method was called.
   */
  optional() {
    debug(`[optional:${this.name}] set as optional`);
    this.options.optional = true;
    return this;
  }

  /**
   * Validate the field data with all registered validation rules.
   *
   * @throws {Error} If one of validation rules failed.
   */
  validate() {
    debug(`[validate:${this.name}] apply ${this.validators.length} validators`);
    if (this.options.optional && typeof this.value === 'undefined')
      return;

    for (const validator of this.validators)
      validator(this.text);
  }


  /**
   * Sanitize the field data with all registered sanitization functions.
   *
   * @return {*} The sanitized value.
   */
  sanitize() {
    debug(`[sanitize:${this.name}] apply ${this.sanitizers.length} sanitizers`);
    let value = this.text;
    for (const sanitizer of this.sanitizers)
      value = sanitizer(value);
    return value;
  }
}

module.exports = Field;
