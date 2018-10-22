export const environment = {
    production: true,
    version: (() => {
        let version = '';
        try {version = require('../../dist/lib/package.json').version; } catch (e) {version = 'n/a'; }
        return version;
    })(),
    travis_build_number: '__TRAVIS_BUILD_NUMBER__'
};
