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
    this.RESPONSIVE_DESKTOP_WEEK = 'rDesktopWeek';
    this.RESPONSIVE_DESKTOP_LAST_6_MONTHS = 'rDesktopLast6Months';
    this.RESPONSIVE_DESKTOP_PREV_6_MONTHS = 'rDesktopPrevious6Months';
    this.RESPONSIVE_MOBILE_WEEK = 'rMobileWeek';
    this.RESPONSIVE_MOBILE_LAST_6_MONTHS = 'rMobileLast6Months';
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
      startDate: '2016-09-28',
      endDate: '2016-10-03'
    }];
    this.reports[this.RESPONSIVE_DESKTOP_WEEK] = {
      title: 'Desktop devices (2016-09-28 to 2016-10-03)',
      request: _request
    };

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
    this.reports[this.RESPONSIVE_DESKTOP_LAST_6_MONTHS] = {
      title: 'Desktop devices (2016-04-01 to 2016-10-01)',
      request: _request
    };

    _request = _.cloneDeep(mobileRequest);
    _request.dateRanges = [{
      startDate: '2016-09-28',
      endDate: '2016-10-03'
    }];
    this.reports[this.RESPONSIVE_MOBILE_WEEK] = {
      title: 'Mobile and tablet devices (2016-09-28 to 2016-10-03)',
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
    this.reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS] = {
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

      jQuery('#content').append('<p id="loading">Loading data ...</p>');

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
      // this.runMobile();
      // this.runResponsive();

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
    displayMobileReports: function (rows) {
      var knownDevices = [];
      var knownDeviceIDs = [];
      var unknownDeviceIDs = [];
      var knownDevicePageviews = 0;
      var unknownDevicePageviews = 0;

      _.forEach(rows, function (row) {
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

        if (width && height) {
          if (_.indexOf(knownDeviceIDs, deviceID) < 0) {
            knownDeviceIDs.push(deviceID);
            knownDevices.push(device['Device Family']);
          }
          knownDevicePageviews += Number(row.Pageviews);
        }
        else {
          unknownDeviceIDs.push(deviceID);
          unknownDevicePageviews += Number(row.Pageviews);
        }
      });

      var mRows = this.parseMobileRows(rows);
      var mBrowserFamilyRows = this.parseMobileBrowserFamily(rows);
      var mOsFamilyRows = this.parseMobileOsFamily(rows);

      var mData = this.parseResponsiveData(mRows, 'width');
      var mBrowserFamilyData = this.parseResponsiveData(mBrowserFamilyRows, 'browserFamily');
      var mOsFamilyData = this.parseResponsiveData(mOsFamilyRows, 'osFamily');

      var id;
      var title;
      var columns;
      var xLabel = 'Screen width';
      var yLabel = 'Pageviews';

      id = ++this.uniqID;
      title = 'Mobile theme: Known vs Unknown screen sizes - 2016-09-28 to 2016-10-03';
      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      c3.generate({
        bindto: '#chart-' + id,
        data: {
          columns: [
            ['Pageviews on known screen sizes', knownDevicePageviews],
            ['Pageviews on unknown screen sizes', unknownDevicePageviews]
          ],
          type: 'pie'
        },
      });

      id = ++this.uniqID;
      title = 'Mobile theme: OS Family - 2016-09-28 to 2016-10-03';
      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      c3.generate({
        bindto: '#chart-' + id,
        data: {
          columns: _.map(mOsFamilyData.values, function (value, key) {
            return [value, mOsFamilyData.metricValues[key]];
          }),
          type: 'pie'
        },
      });

      id = ++this.uniqID;
      title = 'Mobile theme: Browser Family - 2016-09-28 to 2016-10-03';
      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      c3.generate({
        bindto: '#chart-' + id,
        data: {
          columns: _.map(mBrowserFamilyData.values, function (value, key) {
            return [value, mBrowserFamilyData.metricValues[key]];
          }),
          type: 'pie'
        },
      });

      title = 'Mobile theme: Devices with known screen size - 2016-09-28 to 2016-10-03 (' + knownDeviceIDs.length + ' of top 25 devices)';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: yLabel,
        data: mData
      });
      this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);
    },
    parseMobileBrowserFamily: function (rows) {
      var parsed = [];

      _.forEach(rows, function (row) {
        parsed.push({
          browserFamily: row['Browser Family'],
          metricValue: Number(row.Pageviews)
        });
      });

      return parsed;
    },
    parseMobileOsFamily: function (rows) {
      var parsed = [];

      _.forEach(rows, function (row) {
        parsed.push({
          osFamily: row['Os Family'],
          metricValue: Number(row.Pageviews)
        });
      });

      return parsed;
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
    parseResponsiveRows: function (rows, orderBy) {
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

      parsed = _.orderBy(parsed, orderBy);

      return parsed;
    },
    parseResponsiveData: function (rows, column) {
      var values = _.uniq(_.map(rows, function (row) {
        return row[column];
      }));

      var metricValues = _.map(values, function (value) {
        var matches = {};
        matches[column] = value;

        return _.sumBy(_.filter(rows, matches), function (o) {
          return o.metricValue;
        });
      });

      return {
        values: values,
        metricValues: metricValues
      };
    },
    buildResponsiveChartColumns: function () {
      var values = [];

      _.forEach(arguments, function (arg, index) {
        values = values.concat(arg.data.values);
      });

      values.sort(function (a, b) {
        return a - b;
      });

      values = _.sortedUniq(values);

      var metricValues = [];

      _.forEach(arguments, function (arg, index) {
        var arr = _.map(values, function (width) {
          var i = _.indexOf(arg.data.values, width);

          if (i < 0) {
            return 0;
          }
          else {
            return arg.data.metricValues[i];
          }
        });

        metricValues[index] = [arg.yLabel].concat(arr);
      });

      return [
        [arguments[0].xLabel].concat(values)
      ].concat(metricValues);
    },
    displayResponsiveReports: function (reports) {
      var rDesktopLast6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_DESKTOP_LAST_6_MONTHS].response.result.reports[0].data.rows, 'width');
      var rDesktopPrev6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].response.result.reports[0].data.rows, 'width');
      var rDesktopWeekRows = this.parseResponsiveRows(reports[this.RESPONSIVE_DESKTOP_WEEK].response.result.reports[0].data.rows, 'width');
      var rMobileLast6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS].response.result.reports[0].data.rows, 'width');
      var rMobilePrev6Rows = this.parseResponsiveRows(reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].response.result.reports[0].data.rows, 'width');
      var rMobileWeekRows = this.parseResponsiveRows(reports[this.RESPONSIVE_MOBILE_WEEK].response.result.reports[0].data.rows, 'width');

      var rDesktopLast6DataWidth = this.parseResponsiveData(rDesktopLast6Rows, 'width');
      var rDesktopLast6DataHeight = this.parseResponsiveData(rDesktopLast6Rows, 'height');

      var rDesktopPrev6DataWidth = this.parseResponsiveData(rDesktopPrev6Rows, 'width');
      var rDesktopPrev6DataHeight = this.parseResponsiveData(rDesktopPrev6Rows, 'height');

      var rMobileLast6DataWidth = this.parseResponsiveData(rMobileLast6Rows, 'width');
      var rMobileLast6DataHeight = this.parseResponsiveData(rMobileLast6Rows, 'height');

      var rMobilePrev6DataWidth = this.parseResponsiveData(rMobilePrev6Rows, 'width');
      var rMobilePrev6DataHeight = this.parseResponsiveData(rMobilePrev6Rows, 'height');

      var rLast6DataWidth = this.parseResponsiveData(rDesktopLast6Rows.concat(rMobileLast6Rows), 'width');
      var rPrev6DataWidth = this.parseResponsiveData(rDesktopPrev6Rows.concat(rMobilePrev6Rows), 'width');
      var rWeekDataWidth = this.parseResponsiveData(rDesktopWeekRows.concat(rMobileWeekRows), 'width');

      var title;
      var columns;
      var legacyBreakpoints = [
        480,
        600,
        967,
        1140,
        1300,
        1700
      ];
      var frontendComponentsBreakpoints = [
        464,
        752,
        1008,
        1360,
        1920
      ];

      var xLabel = 'Screen width';
      var yLabel = 'Pageviews';

      // title = 'Responsive theme: 2016-09-28 to 2016-10-03';
      // columns = this.buildResponsiveChartColumns({
      //   xLabel: xLabel,
      //   yLabel: yLabel,
      //   data: rWeekDataWidth
      // });
      // this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);
      //
      // title = 'Responsive theme: Last 6 months v Previous 6 months';
      // columns = this.buildResponsiveChartColumns({
      //   xLabel: xLabel,
      //   yLabel: '2015-10-01 to 2016-04-01',
      //   data: rPrev6DataWidth
      // }, {
      //   xLabel: xLabel,
      //   yLabel: '2016-04-01 to 2016-10-01',
      //   data: rLast6DataWidth
      // });
      // this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Desktop v Mobile devices - Last 6 months';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_LAST_6_MONTHS].title,
        data: rDesktopLast6DataWidth
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS].title,
        data: rMobileLast6DataWidth
      });
      this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);

      // title = 'Responsive theme: Desktop v Mobile devices - Previous 6 months';
      // columns = this.buildResponsiveChartColumns({
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
      //   data: rDesktopPrev6DataWidth
      // }, {
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
      //   data: rMobilePrev6DataWidth
      // });
      // this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);
      //
      // title = 'Responsive theme: Last 6 months v Previous 6 months - Desktop devices';
      // columns = this.buildResponsiveChartColumns({
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
      //   data: rDesktopPrev6DataWidth
      // }, {
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_DESKTOP_LAST_6_MONTHS].title,
      //   data: rDesktopLast6DataWidth
      // });
      // this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);
      //
      // title = 'Responsive theme: Last 6 months v Previous 6 months - Mobile devices';
      // columns = this.buildResponsiveChartColumns({
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
      //   data: rMobilePrev6DataWidth
      // }, {
      //   xLabel: xLabel,
      //   yLabel: reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS].title,
      //   data: rMobileLast6DataWidth
      // });
      // this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);

      // title = 'Responsive theme: Legacy breakpoints - Last 6 months';
      // this.plotBreakpoints(++this.uniqID, title, rDesktopLast6Rows.concat(rMobileLast6Rows), legacyBreakpoints);
      //
      // title = 'Responsive theme: frontend-components breakpoints - Last 6 months';
      // this.plotBreakpoints(++this.uniqID, title, rDesktopLast6Rows.concat(rMobileLast6Rows), frontendComponentsBreakpoints);

      title = 'Responsive theme: Desktop v Mobile devices - Last 6 months (includes possible orientation change)';
      columns = this.buildResponsiveChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_LAST_6_MONTHS].title,
        data: rDesktopLast6DataWidth
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS].title,
        data: rMobileLast6DataWidth
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_LAST_6_MONTHS].title + ' (if orientation changed)',
        data: rMobileLast6DataHeight
      });
      this.plotPageviews(++this.uniqID, title, columns, xLabel, yLabel);

      // this.plotPageviewsPie(++this.uniqID, title, [].concat(rDesktopLast6Rows, rMobileLast6Rows));
    },
    plotPageviews: function (id, title, columns, xLabel, yLabel) {
      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /><div id="table-' + id + '" /></section>');

      var metricValueColumns = columns.slice(1);
      var sum = 0;

      _.forEach(metricValueColumns, function (column) {
        sum += _.sum(column.slice(1));
      });

      var metricValuesObj = {};

      _.forEach(columns[0].slice(1), function (value, index) {
        var key = '_' + value;
        metricValuesObj[key] = 0;
      });

      _.forEach(columns[0], function (value, index) {
        // Ignore label (first index)
        if (index === 0) {
          return;
        }

        var key = '_' + value;
        metricValuesObj[key] = 0;

        _.forEach(metricValueColumns, function (metricValueColumn) {
          metricValuesObj[key] += metricValueColumn[index];
        });
      });

      var metricValuesArr = [];

      _.forEach(metricValuesObj, function (metricValue, value) {
        var pct = metricValue / sum;
        metricValuesArr.push({
          value: Number(value.substring(1)),
          metricValue: metricValue,
          pct: pct,
          pctFormatted: d3.format('.1%')(pct)
        });
      });

      metricValuesArr.sort(function (a, b) {
        return b.metricValue - a.metricValue;
      });

      var html = '';

      _.forEach(metricValuesArr.slice(0, 25), function (value) {
        if (value === 0) {
          return;
        }
        html += '<tr><td>' + value.value + '</td><td>' + value.pctFormatted + '</td><td>' + value.metricValue + '</td></tr>';
      });

      jQuery('#table-' + id).html('<table class="table table-striped table-bordered"><tr><th>#</th><th>%</th><th>Value</th></tr>' + html + '</table>');

      c3.generate({
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
            value: function (value) {
              return d3.format(',')(value) + ' (' + d3.format('.1%')(value / sum) + ')';
            }
          }
        }
      });
    },
    // plotPageviewsPie: function (id, title, rows) {
    //   var values = {};
    //
    //   _.forEach(rows, function (row) {
    //     _.forEach(['height', 'width'], function (dim) {
    //       var key = '_' + row[dim];
    //
    //       if (_.isUndefined(values[key])) {
    //         values[key] = row.metricValue;
    //       }
    //       else {
    //         values[key] += row.metricValue;
    //       }
    //     });
    //   });
    //
    //   var xValues = _.map(_.keys(values), function (value) {
    //     return Number(value.substring(1));
    //   });
    //
    //   var yValues = _.values(values);
    //
    //   jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');
    //
    //   c3.generate({
    //     bindto: '#chart-' + id,
    //     data: {
    //       columns: _.map(xValues, function (value, key) {
    //         var label = '' + value;
    //         return [label, yValues[key]];
    //       }),
    //       type: 'pie'
    //     },
    //     legend: {
    //       show: false
    //     }
    //   });
    // },
    findBreakpoint: function (width, breakpoints) {
      var count = breakpoints.length;

      if (!count) {
        return;
      }

      breakpoints.sort(function (a, b) {
        return a - b;
      });

      if (width < breakpoints[0]) {
        return 0;
      }

      for (var i = 0; i < count - 1; i++) {
        if (width >= breakpoints[i] && width < breakpoints[i + 1]) {
          return breakpoints[i];
        }
      }

      return breakpoints[count - 1];
    },
    plotBreakpoints: function (id, title, rows, breakpoints) {
      var values = {};
      values['_0'] = [];

      _.forEach(breakpoints, function (breakpoint) {
        values['_' + breakpoint] = [];
      });

      _.forEach(rows, function (row) {
        var breakpoint = this.findBreakpoint(row.width, breakpoints);
        values['_' + breakpoint].push(row.metricValue);
      }.bind(this));

      var xValues = _.map(_.keys(values), function (value) {
        return Number(value.substring(1));
      });

      var yValues = _.values(values);

      jQuery('#content').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

      c3.generate({
        bindto: '#chart-' + id,
        data: {
          columns: _.map(xValues, function (value, key) {
            var label = '' + value;
            return [label, _.sum(yValues[key])];
          }),
          type: 'pie'
        }
      });
    }
  };

  return Meerkat;
});
