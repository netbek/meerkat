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

      var chart = c3.generate({
        bindto: '#chart',
        data: {
          x: 'Width',
          y: 'Pageviews',
          columns: [
            ['Pageviews'].concat(metricValues), ['Width'].concat(widthValues)
          ],
          type: 'scatter'
        },
        axis: {
          x: {
            label: 'Width'
          },
          y: {
            label: 'Pageviews'
          }
        }
      });
    }
  };

  return Meerkat;
});
