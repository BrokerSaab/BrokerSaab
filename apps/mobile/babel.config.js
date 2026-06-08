module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@shared': './src/shared',
            '@features': './src/features',
            '@theme': './src/shared/theme/index',
            '@components': './src/shared/components/index',
          },
        },
      ],
    ],
  };
};
