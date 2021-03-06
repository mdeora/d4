(function() {
  'use strict';

  var extractValues = function(data, key) {
    var values = data.map(function(obj) {
      return obj.values.map(function(i) {
        return i[key];
      }.bind(this));
    }.bind(this));
    return d3.set(d3.merge(values)).values();
  };

  var rangeFor = function(chart, dimension) {

    // This may not be a very robust approach.
    switch (dimension) {
      case 'x':
        return [0, chart.width];
      case 'y':
        return [chart.height, 0];
      case 'groups':
        var groupDimension = chart.axes.groups.$dimension;
        if (groupDimension === 'x') {
          return [0, chart.axes.x.rangeBand()];
        } else {
          return [chart.axes.y.rangeBand(), 0];
        }
        break;
      default:
        return [];
    }
  };

  var linearOrTimeScale = function(chart, data, dimension) {
    var key = chart[dimension].$key;
    var ext = d3.extent(d3.merge(data.map(function(obj) {
      return d3.extent(obj.values, function(d) {
        if (d4.isDate(d[key])) {
          return d[key];
        } else {
          return d[key] + (d.y0 || 0);
        }
      });
    })));
    var axis = chart[dimension];
    if (!axis.domain.$dirty) {
      if (d4.isDate(ext[0])) {
        var min = axis.$min || ext[0];
        var max = axis.$max || ext[1];
        axis.domain([min, max]);
      } else {
        axis.domain([Math.min(axis.$min || 0, ext[0]), axis.$max || ext[1]]);
      }
    }

    if (!axis.range.$dirty) {
      axis.range(rangeFor(chart, dimension));
    }

    if (!axis.clamp.$dirty) {
      axis.clamp(true);
    }
    return chart[dimension];
  };

  /**
   * Creates a linear scale for a dimension of a given chart.
   * @name linearScaleForNestedData
   * @param {Object} d4 chart object
   * @param {Array} data array
   * @param {string} string represnting a dimension e.g. `x`,`y`.
   * @return {Object} Chart scale object
   */
  d4.builder('linearScaleForNestedData', linearOrTimeScale);

  /**
   * Creates a time scale for a dimension of a given chart.
   * @name timeScaleForNestedData
   * @param {Object} d4 chart object
   * @param {Array} data array
   * @param {string} string represnting a dimension e.g. `x`,`y`.
   * @return {Object} Chart scale object
   */
  d4.builder('timeScaleForNestedData', linearOrTimeScale);

  /**
   * Creates an ordinal scale for a dimension of a given chart.
   * @name ordinalScaleForNestedData
   * @param {Object} d4 chart object
   * @param {Array} data array
   * @param {string} string represnting a dimension e.g. `x`,`y`.
   * @return {Object} Chart scale object
   */
  d4.builder('ordinalScaleForNestedData', function(chart, data, dimension) {
    var parsedData = extractValues(data, chart[dimension].$key);

    // Apply the padding to a `rangeRoundBands` d3 scale. Check for a custom
    // or existing padding set by the scale, otherwise provide a default.
    var bands;
    if (chart[dimension + 'RoundBands']) {
      bands = chart[dimension + 'RoundBands'];
    } else if (chart[dimension].$roundBands) {
      bands = chart[dimension].$roundBands;
    } else {
      bands = 0.3;
    }
    chart[dimension + 'RoundBands'] = bands;

    var axis = chart[dimension];
    if (!axis.domain.$dirty) {
      axis.domain(parsedData);
    }

    if (!axis.rangeRoundBands.$dirty && !axis.rangePoints.$dirty && !axis.rangeBands.$dirty) {
      axis.rangeRoundBands(rangeFor(chart, dimension), bands);
    }
    return axis;
  });

}).call(this);
