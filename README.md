# meerkat

## Installation

Set up Google Analytics Reporting API:

<https://developers.google.com/analytics/devguides/reporting/core/v4/quickstart/web-js>

Install global dependencies:

```
npm install -g gulp-cli bower
```

Install local dependencies:

```
cd /path/to/repository
npm install
```

Create gulp-config-user.js:

```
module.exports = {
  'ga': {
    'clientID': '',
    'viewID': ''
  }
};
```
