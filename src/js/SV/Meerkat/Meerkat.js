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

    var filterPagePath = [
      // Include
      {
        'dimensionName': 'ga:pagePath',
        'operator': 'REGEXP',
        'expressions': [
          '/practice/*'
        ]
      },
      // Exclude
      {
        'dimensionName': 'ga:pagePath',
        'not': true,
        'operator': 'REGEXP',
        'expressions': [
          '/practice/generating-teacher-dashboard/*'
        ]
      },
      // Exclude
      {
        'dimensionName': 'ga:pagePath',
        'not': true,
        'operator': 'REGEXP',
        'expressions': [
          '/practice/question-list'
        ]
      }
    ];

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
      title: 'Desktop (2015-10-01 to 2016-04-01)',
      request: _request
    };

    _request = _.cloneDeep(desktopRequest);
    _request.dateRanges = [{
      startDate: '2016-04-01',
      endDate: '2016-10-01'
    }];
    this.reports[this.RESPONSIVE_DESKTOP_6_MONTHS] = {
      title: 'Desktop (2016-04-01 to 2016-10-01)',
      request: _request
    };

    _request = _.cloneDeep(mobileRequest);
    _request.dateRanges = [{
      startDate: '2015-10-01',
      endDate: '2016-04-01'
    }];
    this.reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS] = {
      title: 'Mobile and tablet (2015-10-01 to 2016-04-01)',
      request: _request
    };

    _request = _.cloneDeep(mobileRequest);
    _request.dateRanges = [{
      startDate: '2016-04-01',
      endDate: '2016-10-01'
    }];
    this.reports[this.RESPONSIVE_MOBILE_6_MONTHS] = {
      title: 'Mobile and tablet (2016-04-01 to 2016-10-01)',
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
    /**
     * Query the API.
     *
     * @return {Promise}
     */
    queryReports: function () {
      jQuery('#charts').append('<p style="margin-top: 2em;">Loading data ...</p>');

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
    parseRows: function (rows) {
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
    parseData: function (rows) {
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
    buildChartColumns: function () {
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
    displayReports: function (reports) {
      jQuery('#charts').empty();

      var rDesktop6Rows = this.parseRows(reports[this.RESPONSIVE_DESKTOP_6_MONTHS].response.result.reports[0].data.rows);
      var rDesktopPrev6Rows = this.parseRows(reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].response.result.reports[0].data.rows);
      var rMobile6Rows = this.parseRows(reports[this.RESPONSIVE_MOBILE_6_MONTHS].response.result.reports[0].data.rows);
      var rMobilePrev6Rows = this.parseRows(reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].response.result.reports[0].data.rows);

      var rDesktop6Data = this.parseData(rDesktop6Rows);
      var rDesktopPrev6Data = this.parseData(rDesktopPrev6Rows);
      var rMobile6Data = this.parseData(rMobile6Rows);
      var rMobilePrev6Data = this.parseData(rMobilePrev6Rows);

      var id = 0;
      var title;
      var columns;
      var xLabel = 'Browser width';
      var yLabel = 'Pageviews';

      title = 'Responsive theme: Desktop v Mobile - Last 6 months';
      columns = this.buildChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_6_MONTHS].title,
        data: rDesktop6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_6_MONTHS].title,
        data: rMobile6Data
      });
      this.displayChart(++id, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Desktop v Mobile - Previous 6 months';
      columns = this.buildChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
        data: rDesktopPrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
        data: rMobilePrev6Data
      });
      this.displayChart(++id, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Last 6 months v Previous 6 months - Desktop';
      columns = this.buildChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_PREV_6_MONTHS].title,
        data: rDesktopPrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_DESKTOP_6_MONTHS].title,
        data: rDesktop6Data
      });
      this.displayChart(++id, title, columns, xLabel, yLabel);

      title = 'Responsive theme: Last 6 months v Previous 6 months - Mobile';
      columns = this.buildChartColumns({
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_PREV_6_MONTHS].title,
        data: rMobilePrev6Data
      }, {
        xLabel: xLabel,
        yLabel: reports[this.RESPONSIVE_MOBILE_6_MONTHS].title,
        data: rMobile6Data
      });
      this.displayChart(++id, title, columns, xLabel, yLabel);
    },
    displayChart: function (id, title, columns, xLabel, yLabel) {
      jQuery('#charts').append('<section><header><h3>' + title + '</h3></header><div id="chart-' + id + '" /></section>');

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
    }

    // displayResults: function (response) {
    //   var rows = [];
    //
    //   _.forEach(response.result.reports[0].data.rows, function (row) {
    //     var dimensions = row.dimensions[0].split('x');
    //
    //     // Exclude unspecified dimensions.
    //     if (dimensions.length < 2) {
    //       return;
    //     }
    //
    //     rows.push({
    //       width: Number(dimensions[0]),
    //       height: Number(dimensions[1]),
    //       metricValue: Number(row.metrics[0].values[0])
    //     });
    //   });
    //
    //   rows = _.orderBy(rows, 'width');
    //
    //   jQuery('#query-output').val(JSON.stringify(rows, null, 2));
    //
    //   var values;
    //   var xLabel;
    //   var yLabel;
    //   var xValues;
    //   var yValues;
    //   var total;
    //   var chart;
    //
    //   //
    //   jQuery('#charts').append('<section><header><h1>Mobile and tablet over browser width (2016-04-01 to 2016-10-01)</h1></header><div id="chart-1" /></section>');
    //
    //   xLabel = 'Browser width';
    //   yLabel = 'Pageviews';
    //
    //   xValues = _.uniq(_.map(rows, function (row) {
    //     return row.width;
    //   }));
    //
    //   yValues = _.map(xValues, function (width) {
    //     return _.sumBy(_.filter(rows, {
    //       'width': width
    //     }), function (o) {
    //       return o.metricValue;
    //     });
    //   });
    //
    //   chart = c3.generate({
    //     bindto: '#chart-1',
    //     data: {
    //       x: xLabel,
    //       y: yLabel,
    //       columns: [
    //         [yLabel].concat(yValues), [xLabel].concat(xValues)
    //       ],
    //       type: 'scatter'
    //     },
    //     axis: {
    //       x: {
    //         label: xLabel
    //       },
    //       y: {
    //         label: yLabel
    //       }
    //     },
    //     legend: {
    //       show: false
    //     }
    //   });
    //
    //   //
    //   jQuery('#charts').append('<section><header><h1>Mobile and tablet over breakpoints (2016-04-01 to 2016-10-01)</h1></header><div id="chart-2" /></section>');
    //
    //   xLabel = 'Breakpoint';
    //   yLabel = 'Pageviews';
    //
    //   values = {
    //     '_0': [],
    //     '_480': [],
    //     '_600': [],
    //     '_967': [],
    //     '_1140': [],
    //     '_1300': [],
    //     '_1700': []
    //   };
    //
    //   _.forEach(rows, function (row) {
    //     if (row.width < 480) {
    //       values['_0'].push(row.metricValue);
    //     }
    //     else if (row.width < 600) {
    //       values['_480'].push(row.metricValue);
    //     }
    //     else if (row.width < 967) {
    //       values['_600'].push(row.metricValue);
    //     }
    //     else if (row.width < 1140) {
    //       values['_967'].push(row.metricValue);
    //     }
    //     else if (row.width < 1300) {
    //       values['_1140'].push(row.metricValue);
    //     }
    //     else if (row.width < 1700) {
    //       values['_1300'].push(row.metricValue);
    //     }
    //     else {
    //       values['_1700'].push(row.metricValue);
    //     }
    //   });
    //
    //   xValues = _.map(_.keys(values), function (value) {
    //     return value.substring(1);
    //   });
    //   yValues = _.values(values);
    //
    //   chart = c3.generate({
    //     bindto: '#chart-2',
    //     data: {
    //       columns: _.map(xValues, function (value, key) {
    //         return ['' + value, _.sum(yValues[key])];
    //       }),
    //       type: 'donut'
    //     },
    //   });
    //
    //   //
    //   jQuery('#charts').append('<section><header><h1>Mobile and tablet over frontend-components breakpoints (2016-04-01 to 2016-10-01)</h1></header><div id="chart-3" /></section>');
    //
    //   xLabel = 'Breakpoint';
    //   yLabel = 'Pageviews';
    //
    //   values = {
    //     '_0': [],
    //     '_464': [],
    //     '_752': [],
    //     '_1008': [],
    //     '_1360': [],
    //     '_1920': []
    //   };
    //
    //   _.forEach(rows, function (row) {
    //     if (row.width < 464) {
    //       values['_0'].push(row.metricValue);
    //     }
    //     else if (row.width < 752) {
    //       values['_464'].push(row.metricValue);
    //     }
    //     else if (row.width < 1008) {
    //       values['_752'].push(row.metricValue);
    //     }
    //     else if (row.width < 1360) {
    //       values['_1008'].push(row.metricValue);
    //     }
    //     else if (row.width < 1920) {
    //       values['_1360'].push(row.metricValue);
    //     }
    //     else {
    //       values['_1920'].push(row.metricValue);
    //     }
    //   });
    //
    //   xValues = _.map(_.keys(values), function (value) {
    //     return value.substring(1);
    //   });
    //   yValues = _.values(values);
    //
    //   chart = c3.generate({
    //     bindto: '#chart-3',
    //     data: {
    //       columns: _.map(xValues, function (value, key) {
    //         return ['' + value, _.sum(yValues[key])];
    //       }),
    //       type: 'donut'
    //     },
    //   });
    // }
  };

  return Meerkat;
});
