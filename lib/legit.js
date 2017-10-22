'use strict';

const debug = require('debug')('legit');
const ContextValidator = require('./ContextValidator');


/**
 * Return middleware that provide the validation and
 * sanitization functions to context.
 * @param {Object} options - Optional configuration
 * @return {Function} - Koa middleware
 */
function legit(options = {}) {
  const {} = options;

  return async (ctx, next) => {
    ctx.validator = new ContextValidator(ctx);
    await next();
  };
}

module.exports = legit;