module.exports = {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  splitting: false,
  clean: true,
  target: 'es2017',
  outDir: 'dist',
};
