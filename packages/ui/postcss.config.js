const path = require('node:path');
const dependencyPaths = [__dirname, path.resolve(__dirname, '../../apps/phone')];
module.exports = {
  plugins: {
    [require.resolve('tailwindcss', { paths: dependencyPaths })]: {},
    [require.resolve('autoprefixer', { paths: dependencyPaths })]: {},
  },
}
