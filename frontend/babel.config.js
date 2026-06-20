// Babel config for Expo. Scaffold default.
// TODO: add plugins (e.g. reanimated) if/when needed during build.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
