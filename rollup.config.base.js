import { readFileSync } from 'fs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

const pkg = JSON.parse(readFileSync('./package.json').toString());

export const sourcemap = true;

export default {
  input: 'd3sparql.js',
  external: ['d3', 'd3-sankey', 'topojson-client'],
  output: {
    name: pkg.name,
    sourcemap,
    banner: `/* ${pkg.name} ${(new Date().toISOString())} */`,
    format: 'amd',
    globals: {
      d3: 'd3',
      'topojson-client': 'topojson',
    },
  },
  plugins: [
    babel({
      sourcemap,
      exclude: 'node_modules/**',
    }),
    terser({
      sourcemap,
    }),
  ],
};
