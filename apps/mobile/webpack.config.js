const nsWebpack = require('@nativescript/webpack');
const Webpack = require('webpack');

module.exports = (env) => {
  nsWebpack.init(env);

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  // NativeScript injects a HMR snippet that references the identifier `module`.
  // In some webpack output modes, `module` isn't available in the wrapper scope
  // which causes `ReferenceError: module is not defined`.
  // This shim ensures `module.hot?.accept` short-circuits safely.
  nsWebpack.chainWebpack((config) => {
    config.plugin('module-shim').use(Webpack.BannerPlugin, [
      {
        banner: 'var module = (typeof module !== "undefined") ? module : (globalThis.module || {});',
        raw: true,
        entryOnly: false,
      },
    ]);
  });

  return nsWebpack.resolveConfig();
};
