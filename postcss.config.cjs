module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 16,
      propList: ['*'],
      minPixelValue: 2,
      exclude: /node_modules/i,
    },
  },
};
