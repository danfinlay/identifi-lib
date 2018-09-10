/*eslint no-useless-escape: "off", camelcase: "off" */

import createHash from 'create-hash';

let isNode = false;
try {
  isNode = Object.prototype.toString.call(global.process) === `[object process]`;
} catch (e) { null; }

export default {
  getHash: function(str, format = `base64`) {
    if (!str) {
      return undefined;
    }
    const hash = createHash(`sha256`);
    hash.update(str);
    return hash.digest(format);
  },

  timeoutPromise(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((resolve => {
        setTimeout(() => {
          resolve();
        }, timeout);
      })),
    ]);
  },

  isNode,
};
