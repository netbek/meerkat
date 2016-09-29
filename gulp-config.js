module.exports = {
  'dist': {
    'js': 'js/',
    'www': 'www/'
  },
  'src': {
    'js': 'src/js/',
    'www': 'src/www/'
  },
  'watchTasks': [
    //
    {
      files: [
        'src/js/**/*.js'
      ],
      tasks: [
        'js'
      ]
    },
    //
    {
      files: [
        'src/www/**/*.html'
      ],
      tasks: [
        'www'
      ]
    }
  ],
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
