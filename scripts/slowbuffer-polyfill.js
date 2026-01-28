'use strict';
/**
 * Polyfill for Node.js 22+ where SlowBuffer was removed.
 * buffer-equal-constant-time (used by jwa -> jsonwebtoken/csurf) crashes without this.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const b = require('buffer');
if (typeof b.SlowBuffer === 'undefined') {
  b.SlowBuffer = b.Buffer;
}
