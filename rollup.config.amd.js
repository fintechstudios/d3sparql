import base from './rollup.config.base.js';

export default {
  ...base,
  output: {
    ...base.output,
    format: 'amd',
  },
};
