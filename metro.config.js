const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// eslint-disable-next-line no-undef
const config = getSentryExpoConfig(__dirname);

config.resolver.sourceExts.push('sql', 'js', 'jsx', 'ts', 'tsx');

module.exports = withNativeWind(config, {
	input: './global.css',
	inlineRem: 16,
});
