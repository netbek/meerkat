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
    this.config = jQuery.extend({
      viewID: undefined, // {String}
      debug: false // {Boolean}
    }, config);

    this.flags = {
      init: false,
      console: !!console
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
    // Query the API and print the results to the page.
    queryReports: function () {
      gapi.client
        .request({
          path: '/v4/reports:batchGet',
          root: 'https://analyticsreporting.googleapis.com/',
          method: 'POST',
          body: {
            reportRequests: [{
              viewId: this.config.viewID,
              dateRanges: [{
                startDate: '2016-02-01',
                endDate: '2016-10-01'
              }],
              samplingLevel: 'LARGE',
              metrics: [{
                expression: 'ga:pageviews'
              }],
              dimensions: [{
                name: 'ga:browserSize'
              }],
              dimensionFilterClauses: [{
                operator: 'AND',
                filters: [
                  // Is mobile or tablet
                  {
                    'dimensionName': 'ga:deviceCategory',
                    'operator': 'IN_LIST',
                    'expressions': [
                      'mobile',
                      'tablet'
                    ]
                  },
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
                ]
              }],
              orderBys: [{
                'fieldName': 'ga:pageviews',
                'orderType': 'VALUE',
                'sortOrder': 'DESCENDING'
              }]
            }]
          }
        })
        .then(this.displayResults, console.error.bind(console));
    },
    displayResults: function (response) {
      var rows = [];

      _.forEach(response.result.reports[0].data.rows, function (row) {
        var dimensions = row.dimensions[0].split('x');

        // Exclude unspecified dimensions.
        if (dimensions.length < 2) {
          return;
        }

        rows.push({
          width: Number(dimensions[0]),
          height: Number(dimensions[1]),
          metricValue: Number(row.metrics[0].values[0])
        });
      });

      rows = _.orderBy(rows, 'width');

      jQuery('#query-output').val(JSON.stringify(rows, null, 2));

      var values;
      var xLabel;
      var yLabel;
      var xValues;
      var yValues;
      var total;
      var chart;

      //
      jQuery('#chart').append('<section><header><h1>Mobile and tablet pageviews over browser width (2016-02-01 to 2016-10-01)</h1></header><div id="chart-1" /></section>');

      xLabel = 'Browser width';
      yLabel = 'Pageviews';

      xValues = _.uniq(_.map(rows, function (row) {
        return row.width;
      }));

      yValues = _.map(xValues, function (width) {
        return _.sumBy(_.filter(rows, {
          'width': width
        }), function (o) {
          return o.metricValue;
        });
      });

      chart = c3.generate({
        bindto: '#chart-1',
        data: {
          x: xLabel,
          y: yLabel,
          columns: [
            [yLabel].concat(yValues), [xLabel].concat(xValues)
          ],
          type: 'scatter'
        },
        axis: {
          x: {
            label: xLabel
          },
          y: {
            label: yLabel
          }
        },
        legend: {
          show: false
        }
      });

      //
      jQuery('#chart').append('<section><header><h1>Mobile and tablet pageviews over breakpoints (2016-02-01 to 2016-10-01)</h1></header><div id="chart-2" /></section>');

      xLabel = 'Breakpoint';
      yLabel = 'Pageviews';

      values = {
        '_0': [],
        '_480': [],
        '_600': [],
        '_967': [],
        '_1140': [],
        '_1300': [],
        '_1700': []
      };

      _.forEach(rows, function (row) {
        if (row.width < 480) {
          values['_0'].push(row.metricValue);
        }
        else if (row.width < 600) {
          values['_480'].push(row.metricValue);
        }
        else if (row.width < 967) {
          values['_600'].push(row.metricValue);
        }
        else if (row.width < 1140) {
          values['_967'].push(row.metricValue);
        }
        else if (row.width < 1300) {
          values['_1140'].push(row.metricValue);
        }
        else if (row.width < 1700) {
          values['_1300'].push(row.metricValue);
        }
        else {
          values['_1700'].push(row.metricValue);
        }
      });

      xValues = _.map(_.keys(values), function (value) {
        return value.substring(1);
      });
      yValues = _.values(values);

      chart = c3.generate({
        bindto: '#chart-2',
        data: {
          columns: _.map(xValues, function (value, key) {
            return ['' + value, _.sum(yValues[key])];
          }),
          type: 'donut'
        },
      });

      //
      jQuery('#chart').append('<section><header><h1>Mobile and tablet pageviews over frontend-components breakpoints (2016-02-01 to 2016-10-01)</h1></header><div id="chart-3" /></section>');

      xLabel = 'Breakpoint';
      yLabel = 'Pageviews';

      values = {
        '_0': [],
        '_464': [],
        '_752': [],
        '_1008': [],
        '_1360': [],
        '_1920': []
      };

      _.forEach(rows, function (row) {
        if (row.width < 464) {
          values['_0'].push(row.metricValue);
        }
        else if (row.width < 752) {
          values['_464'].push(row.metricValue);
        }
        else if (row.width < 1008) {
          values['_752'].push(row.metricValue);
        }
        else if (row.width < 1360) {
          values['_1008'].push(row.metricValue);
        }
        else if (row.width < 1920) {
          values['_1360'].push(row.metricValue);
        }
        else {
          values['_1920'].push(row.metricValue);
        }
      });

      xValues = _.map(_.keys(values), function (value) {
        return value.substring(1);
      });
      yValues = _.values(values);

      chart = c3.generate({
        bindto: '#chart-3',
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
