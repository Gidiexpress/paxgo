module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['transform-inline-environment-variables', {
        include: ['EXPO_PUBLIC_PROJECT_ID', 'EXPO_PUBLIC_AUTH_BROKER_URL']
      }]
    ],
  };
};
