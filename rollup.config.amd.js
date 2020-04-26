import { readFileSync } from 'fs';
import babel from 'rollup-plugin-babel';

const pkg = JSON.parse(readFileSync('./package.json').toString());

export default {
  input: 'd3sparql.js',
  external: ['d3'],
  output: {
    name: pkg.name,
    sourcemap: true,
    banner: `/* ${pkg.name} ${(new Date().toISOString())} */`,
    format: 'amd',
  },
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};
