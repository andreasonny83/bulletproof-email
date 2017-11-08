// Gulp packages
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const gulpSequence = require('gulp-sequence');
const sass = require('gulp-sass');
const fileinclude = require('gulp-file-include');
const inlineCss = require('gulp-inline-css');
const inject = require('gulp-inject');
const minifyHTML = require('gulp-htmlmin');
const zip = require('gulp-zip');
const gulpIf = require('gulp-if');
const changed = require('gulp-changed');
const replace = require('gulp-replace');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const clipboard = require('gulp-clipboard');
const rename = require('gulp-rename');
const argv = require('yargs').argv;
const del = require('del');
const browserSync = require('browser-sync').create();
const nodemailer = require('nodemailer');
const fs = require('fs');

// Config files
let config = {};

let templateName;
let fileExisits = false;

/* Global functions */
// Injects custom messages into stream
function log(msg, color) {
  var msgColor = color ? gutil.colors[color] : gutil.colors.blue;

  if (typeof(msg) === 'object') {
    for (var item in msg) {
      if(msg.hasOwnProperty(item)) {
        gutil.log(msgColor(msg[item]));
      }
    }
  } else {
    gutil.log(msgColor(msg));
  }
}

// Handles error without breaking stream
function handleError(err) {
  gutil.beep();

  log(err.toString(), 'red');

  this.emit('end');
}

// Empty distribution folders
function clean() {
  log('Cleaning up generated files...', 'magenta');

  return del([
    config.productionDir + '/**/*',
    config.localDir + '/**/*'
  ]);
}

// Create a nodemailer config file if doesn't exisit already
gulp.task('postinstall', function() {
  if (!fs.existsSync('./nodemailer.config.js')) {
    return gulp
      .src('./nodemailer.config.js.example')
      .pipe(rename('nodemailer.config.js'))
      .pipe(gulp.dest('./'));
  }
});

gulp.task('init', ['postinstall'], function() {
  config = require('./gulp.config');
});

gulp.task('init:template', function() {
  templateName = argv.template ? argv.template : (argv.t ? argv.t : null);

  if (!templateName || !fs.existsSync(`${config.sourcePath.layouts}/${templateName}`)) {
    gutil.beep();
    log(`
      ***ERROR***: Template name is missing.
      You must specify a template name while running this task.
      Try adding a -t templatename
      Please read the documentation at https://github.com/andreasonny83/email-template-generator/#readme if you're not sure what this means.
    `, 'red');

    return process.exit();
  }

  return log(`Using template: "${templateName}"`, 'green');
});

// Local web server (Default localhost:8080)
// Pass argument --port=XXXX to change
gulp.task('connect', ['html'], function() {
  browserSync.init({
    // Serve files from the local directory
    server: {
      baseDir: config.localDir,
    },
    port: argv.port ? argv.port : config.browsersync.port,
    open: config.browsersync.open || (argv.open || (argv.o || false)),
    notify: config.browsersync.notify
  });

  gulp.watch(`${config.sourcePath.layouts}/${templateName}/**/*`, ['clean', 'html']);

  gulp
    .watch(config.localFiles)
    .on('change', browserSync.reload);
});

// Build CSS files
gulp.task('sass', function() {
  log('Compiling SASS to CSS');

  return gulp
    .src(`${config.sourcePath.layouts}/${templateName}/styles/*.scss`)
    .pipe(plumber({ errorHandler: handleError }))
    .pipe(sass())
    .pipe(autoprefixer({
      browsers: ['> 0%'],
    }))
    .pipe(rename('main.css'))
    .pipe(gulp.dest(config.localDir + '/'));
});

// Compile Layouts into HTML files
gulp.task('html', function() {
  log('Compiling HTML Templates');

  return gulp
    .src(`${config.sourcePath.layouts}/${templateName}/*.html`)
    .pipe(rename('index.html'))
    .pipe(inject(gulp.src(config.localDir + '/main.css', {read: false}), {
      transform: function () {
        return '<link rel="stylesheet" href="main.css">';
      },
      removeTags: true
    }))
    .pipe(gulp.dest(config.localDir));
});

// Inline all CSS styles
// Minify HTML (Optional argument: --minify)
gulp.task('inline-css', function() {
  log('Moving CSS inline');

  return gulp
    .src(`${config.localDir}/index.html`)
    .pipe(inlineCss({
      applyStyleTags: true,
      applyLinkTags: true,
      removeStyleTags: true,
      removeLinkTags: true
    }))
    .pipe(gulpIf(argv.minify, minifyHTML({
      collapseWhitespace: true,
      removeComments: true,
      //  minifyCSS: true, // this convert #ffffff to #fff which is probably not what we don't want
      quoteCharacter: '"'
    })))
    .pipe(gulp.dest(config.productionDir));
});

// Zip all files
gulp.task('zip', function () {
  if (! argv.zip) {
    return;
  }

  log('Compressing into zip file');

  return gulp
    .src(config.productionDir + '/**/**')
    .pipe(zip('all_files.zip'))
    .pipe(gulp.dest(config.productionDir));
});

// Copy a template to the clipboard
// Pass a template name as an argument --template=NAME or -t NAME
gulp.task('copy', function() {
  templateName = argv.template ? argv.template : (argv.t ? argv.t : null);

  if (! templateName) {
    return log('***ERROR***: Name of template is missing.\n', 'red');
  }

  // Copy to Clipboard
  return gulp
    .src(`${config.productionDir}/${templateName}.html`)
    .pipe(clipboard());

  return log('Copied ' + gutil.colors.magenta(templateName + '.html') + ' to clipboard.\n');
});

// Clone a Template
gulp.task('clone', function(cb) {
  if (! argv.from) {
    return log('***ERROR***: You need to specify a source template.\n', 'red');
  }

  if (! argv.to) {
    return log('***ERROR***: You need to specify a name for the new template.\n', 'red');
  }

  // Clone layout
  gulp
    .src([config.sourceDir + '/layouts/' + argv.from + '.html'])
    .pipe(rename(argv.to + '.html'))
    .pipe(replace(argv.from, argv.to))
    .pipe(gulp.dest(config.sourceDir + '/layouts/'));

  // Clone partials
  gulp
    .src([config.sourceDir + '/partials/' + argv.from + '/*'])
    .pipe(gulp.dest(config.sourceDir + '/partials/' + argv.to));

  gutil.log('Cloned to ' + gutil.colors.magenta(argv.to) + ' successfully.\n');
  cb();
});

// Remove a Template
gulp.task('remove', function() {
  templateName = argv.template ? argv.template : (argv.t ? argv.t : null);

  if (!templateName) {
    return log('***ERROR***: Name of template is missing.\n', 'red');
  }

  log('Removed template ' + gutil.colors.magenta(templateName) + ' successfully.\n');

  // Delete from source directory and build directories
  return del([
    config.sourceDir + '/layouts/' + templateName + '.html',
    config.sourceDir + '/partials/' + templateName,
    config.productionDir + '/' + templateName + '.html',
    config.localDir + '/' + templateName + '.html'
  ]);
});

// Send test emails
gulp.task('sendmail', function(cb) {
  // Nodemailer
  var transporter = nodemailer.createTransport(config.nodemailer.transportOptions);
  var mailOptions = config.nodemailer.mailOptions;

  // Update config values
  mailOptions.to = argv.to ? argv.to : config.nodemailer.mailOptions.to;
  mailOptions.subject = argv.subject ? argv.subject : config.nodemailer.mailOptions.subject;

  // get template contents and send email
  fs.readFile(config.productionDir + '/index.html', 'utf8', function(err, data) {
    if (err) {
      handleError(err);
    }

    var regExp = /(\.\.)?\/?images\//g;
    mailOptions.html = data.replace(regExp, config.nodemailer.imageHost);

    // Send the email
    transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
        handleError(err);
      }

      log('Test email for template ' + gutil.colors.magenta(templateName) + ' sent successfully \n');
    });
  });

  cb();
});

gulp.task('clean', function() {
  return clean();
});

/* Tasks */
// Build for local and start browsersync server
gulp.task('serve', gulpSequence('clean', 'init', 'init:template', 'sass', 'html', 'connect'));

// Build for Production
gulp.task('build', gulpSequence('clean', 'init', 'init:template', 'sass', 'html', 'inline-css', 'zip'));

// Default
gulp.task('default', ['serve']);

// Send test email using nodemailer
gulp.task('mail', ['init', 'sendmail']);
