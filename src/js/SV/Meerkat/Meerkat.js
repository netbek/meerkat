(function (name, definition) {
  var theModule = definition();
  var hasDefine = typeof define === 'function' && define.amd;
  var hasExports = typeof module !== 'undefined' && module.exports;

  // AMD Module
  if (hasDefine) {
    define(theModule);
  }
  // Node.js Module
  else if (hasExports) {
    module.exports = theModule;
  }
  // Assign to common namespaces or simply the global object (window)
  else {
    (this.SV = this.SV || {})[name] = theModule;
  }
})('Meerkat', function () {
  var moduleName = 'Meerkat';

  /**
   *
   * @param  {Object} config
   * @return {Meerkat}
   */
  function Meerkat(config) {
    this.RESPONSIVE_DESKTOP_6_MONTHS = 'rDesktop6Months';
    this.RESPONSIVE_DESKTOP_PREV_6_MONTHS = 'rDesktopPrevious6Months';
    this.RESPONSIVE_MOBILE_6_MONTHS = 'rMobile6Months';
    this.RESPONSIVE_MOBILE_PREV_6_MONTHS = 'rMobilePrevious6Months';

    this.config = jQuery.extend({
      viewID: undefined, // {String}
      debug: false // {Boolean}
    }, config);

    this.flags = {
      init: false,
      console: !!console
    };

    this.uniqID = 0;

    var filterDesktop = [{
      'dimensionName': 'ga:deviceCategory',
      'operator': 'IN_LIST',
      'expressions': [
        'desktop'
      ]
    }];

    var filterMobile = [{
      'dimensionName': 'ga:deviceCategory',
      'operator': 'IN_LIST',
      'expressions': [
        'mobile',
        'tablet'
      ]
    }];

    var filterPagePath = [{
      'dimensionName': 'ga:pagePath',
      'operator': 'REGEXP',
      'expressions': [
        '/practice/.+/exercise'
      ]
    }];

    var desktopRequest = {
      viewId: this.config.viewID,
      samplingLevel: 'LARGE',
      metrics: [{
        expression: 'ga:pageviews'
      }],
      dimensions: [{
        name: 'ga:browserSize'
      }],
      dimensionFilterClauses: [{
        operator: 'AND',
        filters: [].concat(filterDesktop, filterPagePath)
      }],
      orderBys: [{
        'fieldName': 'ga:pageviews',
        'orderType': 'VALUE',
        'sortOrder': 'DESCENDING'
      }]
    };

    var mobileRequest = {
      viewId: this.config.viewID,
      samplingLevel: 'LARGE',
      metrics: [{
        expression: 'ga:pageviews'
      }],
      dimensions: [{
        name: 'ga:browserSize'
      }],
      dimensionFilterClauses: [{
        operator: 'AND',
        filters: [].concat(filterMobile, filterPagePath)
      }],
      orderBys: [{
        'fieldName': 'ga:pageviews',
        'orderType': 'VALUE',
        'sortOrder': 'DESCENDING'
      }]
    };

    this.reports = {};

    var _request;

    _request = _.cloneDeep(desktopRequest);
    _request.dateRanges = [{
      startDate: '2015-10-01',
      endDate: '2016-04-01'
    }];
    this.reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS] = {
      title: 'Desktop devices (2015-10-01 to 2016-04-01)',
      request: _request
    };

    _request = _.cloneDeep(desktopRequest);
    _request.dateRanges = [{
      startDate: '2016-04-01',
      endDate: '2016-10-01'
    }];
    this.reports[this.RESPONSIVE_DESKTOP_6_MONTHS] = {
      title: 'Desktop devices (2016-04-01 to 2016-10-01)',
      request: _request
    };

    _request = _.cloneDeep(mobileRequest);
    _request.dateRanges = [{
      startDate: '2015-10-01',
      endDate: '2016-04-01'
    }];
    this.reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS] = {
      title: 'Mobile and tablet devices (2015-10-01 to 2016-04-01)',
      request: _request
    };

    _request = _.cloneDeep(mobileRequest);
    _request.dateRanges = [{
      startDate: '2016-04-01',
      endDate: '2016-10-01'
    }];
    this.reports[this.RESPONSIVE_MOBILE_6_MONTHS] = {
      title: 'Mobile and tablet devices (2016-04-01 to 2016-10-01)',
      request: _request
    };
  }

  Meerkat.prototype = {
    prototype: Meerkat,
    /**
     *
     * @return {Meerkat}
     */
    init: function () {
      if (this.flags.init) {
        return this;
      }

      this.log(moduleName + '.init()');

      jQuery('#content').append('<p id="loading" style="margin-top: 2em;">Loading data ...</p>');

      this.flags.init = true;

      return this;
    },
    /**
     *
     */
    destroy: function () {
      if (!this.flags.init) {
        return;
      }

      this.log(moduleName + '.destroy()');
    },
    /**
     *
     * @param {String} msg
     */
    log: function (msg) {
      if (this.config.debug && this.flags.console) {
        console.debug(msg);
      }
    },
    run: function () {
      this.runMobile()
        .then(function () {
          return this.runResponsive();
        }.bind(this))
        .then(function () {
          jQuery('#loading').remove();
        });
    },
    runMobile: function () {
      return this.queryMobileReports()
        .then(function (data) {
          this.displayMobileReports(data);

          return Promise.resolve(true);
        }.bind(this));
    },
    queryMobileReports: function () {
      return new Promise(function (resolve, reject) {
        jQuery.ajax({
          url: 'http://localhost:8000/data/mobile-results.json',
          dataType: 'json',
          cache: false,
          success: function (data) {
            resolve(data);
          },
          error: function (jqXHR, textStatus, errorThrown) {
            reject(textStatus);
          }
        });
      });
    },
    displayMobileReports: function (data) {
      var knownDevices = [];

      _.forEach(data, function (row) {
        var device = _.pick(row, [
          'Device Family',
          'Os Family',
          'Os Version',
          'Browser Family',
          'Browser Version'
        ]);
        var deviceID = _.values(device).join('-');
        var width = Number(row['Screen Width']);
        var height = Number(row['Screen Height']);

        if (width && height && _.indexOf(knownDevices, deviceID) < 0) {
          knownDevices.push(deviceID);
        }
      });

      var mRows = this.parseMobileRows(data);

      var mData = this.parseResponsiveData(mRows);

      var title;
      var columns;
      var xLabel = 'Screen width';
      var yLabel = 'Pageviews';

      title = 'Mobile theme: Top 25 devices by pageviews with known screen size (' + knownDevices.length + ' devices) - 2016-09-28 to 2016-10-03';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: yLabel,
        data: mData
      });
      this.plotPageviewsOverWidth(++this.uniqID, title, columns, xLabel, yLabel);
    },
    parseMobileRows: function (rows) {
      var parsed = [];

      _.forEach(rows, function (row) {
        var width = Number(row['Screen Width']);
        var height = Number(row['Screen Height']);

        // Exclude unspecified dimensions.
        if (!width || !height) {
          return;
        }

        parsed.push({
          width: width,
          height: height,
          metricValue: Number(row.Pageviews)
        });
      });

      parsed = _.orderBy(parsed, 'width');

      return parsed;
    },
    runResponsive: function () {
      return this.queryResponsiveReports()
        .then(function (reports) {
          this.displayResponsiveReports(reports);

          return Promise.resolve(true);
        }.bind(this));
    },
    /**
     * Fetch data for responsive theme.
     *
     * @return {Promise}
     */
    queryResponsiveReports: function () {
      return Promise.mapSeries(_.keys(this.reports), function (key) {
          return new Promise(function (resolve, reject) {
            gapi.client
              .request({
                path: '/v4/reports:batchGet',
                root: 'https://analyticsreporting.googleapis.com/',
                method: 'POST',
                body: {
                  reportRequests: [this.reports[key].request]
                }
              })
              .then(function (response) {
                this.reports[key].response = response;
                resolve(response);
              }.bind(this), console.error.bind(console));
          }.bind(this));
        }.bind(this))
        .then(function () {
          return Promise.resolve(this.reports);
        }.bind(this));
    },
    parseResponsiveRows: function (rows) {
      var parsed = [];

      _.forEach(rows, function (row) {
        var dimensions = row.dimensions[0].split('x');

        // Exclude unspecified dimensions.
        if (dimensions.length < 2) {
          return;
        }

        parsed.push({
          width: Number(dimensions[0]),
          height: Number(dimensions[1]),
          metricValue: Number(row.metrics[0].values[0])
        });
      });

      parsed = _.orderBy(parsed, 'width');

      return parsed;
    },
    parseResponsiveData: function (rows) {
      var widthValues = _.uniq(_.map(rows, function (row) {
        return row.width;
      }));

      var metricValues = _.map(widthValues, function (width) {
        return _.sumBy(_.filter(rows, {
          'width': width
        }), function (o) {
          return o.metricValue;
        });
      });

      return {
        widthValues: widthValues,
        metricValues: metricValues
      };
    },
    buildResponsiveChartColumns: function () {
      var widthValues = [];

      _.forEach(arguments, function (arg, index) {
        widthValues = widthValues.concat(arg.data.widthValues);
      });

      widthValues.sort(function (a, b) {
        return a - b;
      });

      widthValues = _.sortedUniq(widthValues);

      var metricValues = [];

      _.forEach(arguments, function (arg, index) {
        var values = _.map(widthValues, function (width) {
          var i = _.indexOf(arg.data.widthValues, width);

          if (i < 0) {
            return 0;
          }
          else {
            return arg.data.metricValues[i];
          }
        });

        metricValues[index] = [arg.yLabel].concat(values);
      });

      return [
        [arguments[0].xLabel].concat(widthValues)
      ].concat(metricValues);
    },
    displayResponsiveReports: function (reports) {
      var rDesktop6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_DESKTOP_6_MONTHS].response.result.reports[0].data.rows);
      var rDesktopPrev6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].response.result.reports[0].data.rows);
      var rMobile6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_MOBILE_6_MONTHS].response.result.reports[0].data.rows);
      var rMobilePrev6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].response.result.reports[0].data.rows);

      var rDesktop6Data = this.parseResponsiveData(rDesktop6Rows);
      var rDesktopPrev6Data = this.parseResponsiveData(rDesktopPrev6Rows);
      var rMobile6Data = this.parseResponsiveData(rMobile6Rows);
      var rMobilePrev6Data = this.parseResponsiveData(rMobilePrev6Rows);

      var title;
      var columns;
      var legacyBreakpoints = [
        0,
        480,
        600,
        967,
        1140,
        1300,
        1700
      ];
      var frontendComponentsBreakpoints = [
        0,
        464,
        752,
        1008,
        1360,
        1920
      ];

      var xLabel = 'Screen width';
      var yLabel = 'Pageviews';

      title = 'Responsive theme: Desktop v Mobile devices - Last 6 months';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_6_MONTHS].title,
        data: rDesktop6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_6_MONTHS].title,
        data: rMobile6Data
      });
      this.plotPageviewsOverWidth(++this.uniqID, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Desktop v Mobile devices - Previous 6 months';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
        data: rDesktopPrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
        data: rMobilePrev6Data
      });
      this.plotPageviewsOverWidth(++this.uniqID, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Last 6 months v Previous 6 months - Desktop devices';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
        data: rDesktopPrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_6_MONTHS].title,
        data: rDesktop6Data
      });
      this.plotPageviewsOverWidth(++this.uniqID, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Last 6 months v Previous 6 months - Mobile devices';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
        data: rMobilePrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_6_MONTHS].title,
        data: rMobile6Data
      });
      this.plotPageviewsOverWidth(++this.uniqID, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Legacy breakpoints - Last 6 months';
      this.plotBreakpoints(++this.uniqID, title, rDesktop6Rows.concat(rMobile6Rows), legacyBreakpoints);

      title = 'Responsive theme: frontend-components breakpoints - Last 6 months';
      this.plotBreakpoints(++this.uniqID, title, rDesktop6Rows.concat(rMobile6Rows), frontendComponentsBreakpoints);
    },
    plotPageviewsOverWidth: function (id, title, columns, xLabel, yLabel) {
      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      var chart = c3.generate({
        bindto: '#chart-' + id,
        data: {
          x: xLabel,
          columns: columns,
          type: 'scatter'
        },
        axis: {
          x: {
            label: xLabel
          },
          y: {
            label: yLabel,
            tick: {
              format: d3.format('s')
            }
          }
        },
        tooltip: {
          format: {
            value: function (value, ratio, id) {
              return d3.format(',')(value);
            }
          }
        }
      });
    },
    plotBreakpoints: function (id, title, rows, breakpoints) {
      var values = {};

      _.forEach(breakpoints, function (breakpoint) {
        values['_' + breakpoint] = [];
      });

      var breakpointsCount = breakpoints.length;

      _.forEach(rows, function (row) {
        var breakpoint;
        for (var i = 0; i < breakpointsCount; i++) {
          breakpoint = breakpoints[i];
          if (row.width < breakpoint) {
            values['_' + breakpoints[i - 1]].push(row.metricValue);
            return;
          }
        }
        values['_' + breakpoints[breakpointsCount - 1]].push(row.metricValue);
      });

      var xValues = _.map(_.keys(values), function (value) {
        return value.substring(1);
      });

      var yValues = _.values(values);

      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      var chart = c3.generate({
        bindto: '#chart-' + id,
        data: {
          columns: _.map(xValues, function (value, key) {
            return ['' + value, _.sum(yValues[key])];
          }),
          type: 'donut'
        },
      });
    }
  };

  return Meerkat;
});
