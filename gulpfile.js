var _ = require('lodash');
var del = require('del');
var fs = require('fs');
var gulp = require('gulp');
var handlebars = require('handlebars');
var livereload = require('livereload');
var mkdirp = require('mkdirp');
var open = require('open');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var webserver = require('gulp-webserver');

Promise.promisifyAll(fs);

var mkdirpAsync = Promise.promisify(mkdirp);

/*******************************************************************************
 * Config
 ******************************************************************************/

var config = require('./gulp-config.js');

// Override config with per-user config.
if (fs.existsSync('./gulp-config-user.js')) {
  var userConfig = require('./gulp-config-user.js');
  _.merge(config, userConfig);
}

var livereloadOpen = (config.webserver.https ? 'https' : 'http') + '://' + config.webserver.host + ':' + config.webserver.port + (config.webserver.open ? config.webserver.open : '/');

/*******************************************************************************
 * Misc
 ******************************************************************************/

var flags = {
  livereloadInit: false // Whether `livereload-init` task has been run
};
var server;

// Choose browser for node-open.
var browser = config.webserver.browsers.default;
var platform = os.platform();
if (_.has(config.webserver.browsers, platform)) {
  browser = config.webserver.browsers[platform];
}

/*******************************************************************************
 * Functions
 ******************************************************************************/

/**
 * Start a watcher.
 *
 * @param {Array} files
 * @param {Array} tasks
 * @param {Boolean} livereload Set to TRUE to force livereload to refresh the page.
 */
function startWatch(files, tasks, livereload) {
  if (livereload) {
    tasks.push('livereload-reload');
  }

  gulp.watch(files, function () {
    runSequence.apply(null, tasks);
  });
}

/*******************************************************************************
 * Livereload tasks
 ******************************************************************************/

// Start webserver.
gulp.task('webserver-init', function (cb) {
  var conf = _.clone(config.webserver);
  conf.open = false;

  gulp.src('./')
    .pipe(webserver(conf))
    .on('end', cb);
});

// Start livereload server
gulp.task('livereload-init', function (cb) {
  if (!flags.livereloadInit) {
    flags.livereloadInit = true;
    server = livereload.createServer();
    open(livereloadOpen, browser);
  }

  cb();
});

// Refresh page
gulp.task('livereload-reload', function (cb) {
  server.refresh(livereloadOpen);
  cb();
});

/*******************************************************************************
 * Tasks
 ******************************************************************************/

gulp.task('clean', function () {
  return del([
    config.dist.js,
    config.dist.www
  ]);
});

gulp.task('js', function (cb) {
  gulp
    .src([config.src.js + '**/*'])
    .pipe(gulp.dest(config.dist.js))
    .on('end', cb);
});

gulp.task('www', function (cb) {
  var src = config.src.www + 'index.html';
  var dst = config.dist.www + 'index.html';

  fs.readFileAsync(src, 'utf8')
    .then(function (data) {
      var input = handlebars.compile(data);

      var output = input({
        clientID: config.ga.clientID,
        viewID: config.ga.viewID
      });

      var dirname = path.dirname(dst);

      return mkdirpAsync(dirname)
        .then(function () {
          return fs.writeFileAsync(dst, output, 'utf8');
        });
    })
    .then(function () {
      cb();
    });
});

gulp.task('build', function (cb) {
  runSequence(
    'clean',
    'js',
    'www',
    cb
  );
});

gulp.task('livereload', function () {
  runSequence(
    'build',
    'webserver-init',
    'livereload-init',
    'watch:livereload'
  );
});

/*******************************************************************************
 * Watch tasks
 ******************************************************************************/

// Watch with livereload that doesn't rebuild docs
gulp.task('watch:livereload', function (cb) {
  var livereloadTask = 'livereload-reload';

  _.forEach(config.watchTasks, function (watchConfig) {
    var tasks = _.clone(watchConfig.tasks);
    tasks.push(livereloadTask);
    startWatch(watchConfig.files, tasks);
  });
});

/*******************************************************************************
 * Default task
 ******************************************************************************/

gulp.task('default', ['livereload']);
