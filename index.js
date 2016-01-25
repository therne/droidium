/**
 * Created by vista on 2015. 12. 19..
 */
'use strict';

const co = require('co');
const fs = require('fs');

co(require('./app')).catch(function*(err) { console.error(err.message) });