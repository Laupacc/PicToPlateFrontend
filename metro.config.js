const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
    const config = getDefaultConfig(__dirname);

    config.transformer = {
        ...config.transformer,
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
        experimentalImportSupport: true,
    };

    config.resolver = {
        ...config.resolver,
        sourceExts: [...config.resolver.sourceExts, 'cjs', 'mjs'], // Support for different module types
    };

    return config;
})();
