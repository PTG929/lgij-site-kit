import * as esbuild from 'esbuild';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const version = process.argv[2] || '1.0.0';
const cssText = minify => ({
  name: 'css-text',
  setup(b) {
    b.onLoad({ filter: /\.css$/ }, async args => {
      let css = await readFile(args.path, 'utf8');
      if (minify) css = (await esbuild.transform(css, { loader: 'css', minify: true })).code;
      return { contents: `export default ${JSON.stringify(css)};`, loader: 'js' };
    });
  }
});
for (const minify of [false, true]) {
  const out = `dist/lgij-party-builder${minify ? '.min' : ''}.js`;
  await esbuild.build({ entryPoints: ['src/party-builder.js'], bundle: true, format: 'iife', target: 'es2019', minify, legalComments: 'inline', define: { __LGIJ_VERSION__: JSON.stringify(version) }, plugins: [cssText(minify)], outfile: out, logLevel: 'warning' });
  const buf = await readFile(out);
  console.log(out, buf.length, 'bytes', createHash('sha256').update(buf).digest('hex'));
}
