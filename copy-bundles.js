//
// This script copies over UMD bundles to the project's assets folder
// It's called by the npm script npx-build-plus:copy-assets
// If you call it manually, call it from your projects root
// > node /copy-bundles.js
//

// const copy = require('copy');
//
// console.log('Copy UMD bundles ...');
//
// copy('node_modules/@angular/*/bundles/*.umd.js', 'src/assets', {}, _ => {});
// copy('node_modules/rxjs/bundles/*.js', 'src/assets/rxjs', {}, _ => {});
// copy('node_modules/zone.js/dist/*.js', 'src/assets/zone.js', {}, _ => {});
// copy('node_modules/core-js/client/*.js', 'src/assets/core-js', {}, _ => {});

const copy = require('copyfiles');

// copy angular bundles
copy(['node_modules/@angular/*/bundles/{core,common,platform-browser,elements}.umd.js', 'dist/externals/'], true, _ => {});
// copy rxjs bundle
copy(['node_modules/rxjs/bundles/*.js', 'dist/externals/'], true, _ => {});
// copy core-js bundle
copy(['node_modules/core-js/client/core.js', 'dist/externals/'], true, _ => {});
// copy custom-elements
copy(['node_modules/@webcomponents/custom-elements/custom-elements.min.js', 'dist/externals/'], true, _ => {});
// copy native-shim
copy(['node_modules/@webcomponents/custom-elements/src/native-shim.js', 'dist/externals/'], true, _ => {});
