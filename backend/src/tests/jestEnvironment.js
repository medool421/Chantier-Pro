const NodeEnvironment = require('jest-environment-node');
const { TextEncoder, TextDecoder } = require('util');

const webGlobals = ['Headers', 'Request', 'Response', 'FormData', 'Blob', 'File'];

class JestNodeEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;

    webGlobals.forEach(name => {
      if (typeof globalThis[name] !== 'undefined') {
        this.global[name] = globalThis[name];
      }
    });
  }
}

module.exports = JestNodeEnvironment;
