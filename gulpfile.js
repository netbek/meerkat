var _ = require('lodash');
var fs = require('fs');
var gulp = require('gulp');
var handlebars = require('handlebars');
var livereload = require('livereload');
var mkdirp = require('mkdirp');
var open = require('open');
var os = require('os');
var path = require('path');
var Promise = require('bluebird');
var runSequence = require('run-sequence');
var webserver = require('gulp-webserver');

Promise.promisifyAll(fs);

var mkdirpAsync = Promise.promisify(mkdirp);

/*******************************************************************************
 * Config
 ******************************************************************************/

var config = {
  'ga': {
    'clientID': 'lorem',
    'viewID': 'ipsum'
  },
  'webserver': {
    'host': 'localhost',
    'port': 8000,
    'path': '/',
    'livereload': false,
    'directoryListing': false,
    'open': '/www/',
    'https': false,
    'browsers': {
      'default': 'firefox',
      'darwin': 'google chrome',
      'linux': 'google-chrome',
      'win32': 'chrome'
    }
  }
};

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

gulp.task('dev', function (cb) {
  var src = 'src/index.html';
  var dst = 'www/index.html';

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

gulp.task('livereload', function () {
  runSequence(
    'dev',
    'webserver-init',
    'livereload-init'
    // 'watch:livereload'
  );
});

/*******************************************************************************
 * Default task
 ******************************************************************************/

gulp.task('default', ['livereload']);
