/*
* All gulpfile configuration options
*/

const nodemailerConfig = require('./nodemailer.config')();

const sourceDir = 'src';
const distDir = 'dist';
const localDir = 'local';
const productionDir = 'production';

module.exports = {
  distDir: distDir,
  localDir: `${distDir}/${localDir}`,
  productionDir: `${distDir}/${productionDir}`,
  sourceDir: sourceDir,

  localFiles: [
    `${distDir}/${localDir}/css/*.css`,
    `${distDir}/${localDir}/*.html`,
  ],

  sourcePath: {
    layouts: `${sourceDir}/layouts`,
  },

  browsersync: {
    port: 8080,
    open: false,
    notify: true
  },

  nodemailer: nodemailerConfig
}
