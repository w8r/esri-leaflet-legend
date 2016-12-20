(function (factory) {
  //define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet', 'esri-leaflet'], function (L, EsriLeaflet) {
      return factory(L, EsriLeaflet);
    });
  //define a common js module that relies on 'leaflet'
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('leaflet'), require('esri-leaflet'));
  }

  if(typeof window !== 'undefined' && window.L){
    factory(window.L, L.esri);
  }
}(function (L, EsriLeaflet) {

/**
 * @example
 * <code>
 * L.esri.Util.queue(
 *   [1, 2, 3], [], function(curr, item, cb){
 *     setTimeout(function(){
 *       cb(null, curr.concat([item + 10]));
 *     }, 200);
 *   }, function(err, result) {
 *     console.log(result); // [11, 12, 13]
 * });
 * </code>
 * @param  {Array.<*>} values
 * @param  {*}         initial
 * @param  {Function}  fn       process item fn(memo, item, callback)
 * @param  {Function}  done     queue complete
 * @param  {*=}        context
 */
EsriLeaflet.Util.reduce = function(values, initial, fn, cb, context) {
  var curr = initial;

  function next(index) {
    var sync = true;
    for (var i = index; i < values.length; i++) {
      var done = false;
      fn(curr, values[i], function(err, val) {
        if (err) {
          return cb.call(context, err, curr);
        }
        done = true;
        curr = val;
        if (!sync) {
          next(i + 1);
        }
      });
      sync = done;
      if (!sync) {
        return;
      }
    }
    cb.call(context, null, curr);
  }

  next(0);
};


EsriLeaflet.MapService.include({

  legend: function(callback, context) {
    return new EsriLeaflet.Legend(this).run(callback, context);
  }

});


EsriLeaflet.FeatureLayerService.include({

  legend: function(callback, context) {
    return new L.esri.Legend(this).run(callback, context);
  }

});


EsriLeaflet.Legend = EsriLeaflet.Task.extend({
  path: 'legend',

  params: {
    f: 'json'
  },

  run: function(callback, context) {
    if (this._service) {
      return this._service.request(this.path, this.params, callback, context);
    } else {
      return this._request('request', this.path, this.params, callback, context);
    }
  }

});

EsriLeaflet.legend = function(params) {
  return new EsriLeaflet.Legend(params);
};


EsriLeaflet.Legend.include({

  initialize: function(endpoint) {
    this._renderer = new EsriLeaflet.Legend.SymbolRenderer();
    EsriLeaflet.Task.prototype.initialize.call(this, endpoint);
  },

  run: function(callback, context) {
    function cb(error, response) {
      if (error && error.code === 400) { // ArcGIS server >=10.0
        this._collectLegendFromLayers(callback, context);
      } else if (response && response.drawingInfo) {
        this._symbolsToLegends([response], function(err, result) {
          callback.call(context, err, {
            layers: result
          });
        });
      } else {
        callback.call(context, error, response);
      }
    }

    if (this._service) {
      return this._service.request(this.path, this.params, cb, this);
    } else {
      return this._request('request', this.path, this.params, cb, this);
    }
  },

  _collectLegendFromLayers: function(callback, context) {
    this._service.metadata(function(error, response) {
      if (error) {
        return callback.call(context, error);
      }

      var layers = [];
      for (var i = 0, len = response.layers.length; i < len; i++) {
        if (!response.layers[i].subLayerIds) {
          layers.push(response.layers[i]);
        }
      }

      this._getLayersLegends(layers, function(err, layerData) {
        if (err) {
          callback.call(context, err);
        } else {
          this._symbolsToLegends(layerData, function(err, result) {
            callback.call(context, err, {
              layers: result
            });
          });
        }
      }, this);
    }, this);
  },

  _getLayersLegends: function(layerDefs, callback, context) {
    var layerData = [];
    var self = this;

    EsriLeaflet.Util.reduce(layerDefs, [], function(curr, layer, cb) {
      self._getLayerLegend(layer, function(err, data) {
        if (err) {
          return cb(err, null);
        }
        cb(null, curr.concat(data));
      }, self);
    }, function(err, result) {
      callback.call(context, err, result);
    });
  },

  _getLayerLegend: function(layer, callback, context) {
    this._service.request(layer.id, {
      f: 'json'
    }, callback, context);
  },

  _symbolsToLegends: function(layerData, callback, context) {
    var self = this;
    EsriLeaflet.Util.reduce(layerData, [], function(curr, layer, cb) {
      self._drawingInfoToLegend(layer.drawingInfo, function(err, legend) {
        if (err) {
          return cb(err, null);
        }
        cb(null, curr.concat([{
          layerId: layer.id,
          layerType: layer.type,
          layerName: layer.name,
          maxScale: layer.maxScale,
          minScale: layer.minScale,
          legend: legend
        }]));
      }, self);
    }, function(err, result) {
      callback.call(context, err, result);
    });
  },

  _getRendererSymbols: function(renderer) {
    var symbols;
    if (renderer.type === 'uniqueValue') {
      symbols = renderer.uniqueValueInfos.slice();
    } else if (renderer.type === 'classBreaks') {
      symbols = renderer.classBreakInfos.slice();
    } else if (renderer.type === 'simple') {
      symbols = [{
        symbol: renderer.symbol,
        label: renderer.label,
        description: renderer.description,
        value: renderer.value
      }];
    }
    if (renderer.defaultSymbol) {
      symbols.push({
        symbol: renderer.defaultSymbol,
        label: renderer.defaultLabel,
        description: '',
        value: null
      });
    }
    return symbols;
  },

  _drawingInfoToLegend: function(drawingInfo, callback, context) {
    var self = this;
    EsriLeaflet.Util.reduce(
      this._getRendererSymbols(drawingInfo.renderer), [],
      function(curr, symbol, cb) {
        self._renderSymbol(symbol, function(err, image) {
          if (err) {
            return cb(err, curr);
          }
          cb(null, curr.concat([{
            label: symbol.label,
            height: image.height,
            url: symbol.symbol.url,
            imageData: image.imageData,
            contentType: image.contentType,
            width: image.width,
            values: [symbol.value || '']
          }]));
        }, self);
      },
      function(err, legend) {
        callback.call(context, err, legend);
      });
  },

  _renderSymbol: function(symbol, callback, context) {
    return this._renderer.render(symbol.symbol, callback, context);
  }

});


EsriLeaflet.Legend.SymbolRenderer = L.Class.extend({

  statics: {
    SYMBOL_TYPES: {
      MARKER: 'esriSMS',
      LINE: 'esriSLS',
      FILL: 'esriSFS',
      PICTURE_MARKER: 'esriPMS',
      PICTURE_FILL: 'esriPFS',
      TEXT: 'esriTS'
    },
    DEFAULT_SIZE: 20
  },

  render: function(symbol, callback, context) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var imageData = symbol.imageData;
    this._setSize(canvas, symbol);

    function done(error, imageData) {
      if (error) {
        callback.call(context, error);
      } else {
        callback.call(context, null, {
          width: canvas.width || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          height: canvas.height || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          imageData: imageData.replace('data:image/png;base64,', ''),
          url: null,
          contentType: 'image/png'
        });
      }
    }

    if (symbol.imageData) {
      return done(null, symbol.imageData);
    }

    switch (symbol.type) {
      case 'esriSMS':
        this._renderMarker(ctx, symbol, done);
        break;
      case 'esriSLS':
        this._renderLine(ctx, symbol, done);
        break;
      case 'esriSFS':
        this._renderFill(ctx, symbol, done);
        break;
      case 'esriPMS':
        this._renderImageMarker(ctx, symbol, done);
        break;
      case 'esriPFS':
        this._renderImageFill(ctx, symbol, done);
        break;
      case 'esriST':
        this._renderText(ctx, symbol, done);
        break;
      default:
        break;
    }
  },

  _renderText: function(ctx, symbol, callback) {
    callback(null, ctx.canvas.toDataURL());
  },

  _renderFill: function(ctx, symbol, callback) {
    var size = EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE;
    var lineWidth = symbol.outline ? symbol.outline.width : 1;
    var lineOffset = Math.max(5, lineWidth * 3);
    switch (symbol.style) {

      case 'esriSFSVertical':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSHorizontal':
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSBackwardDiagonal':
        this._setRotation(ctx, -45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSForwardDiagonal':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSCross':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSDiagonalCross':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSSolid':
        ctx.fillStyle = this._formatColor(symbol.color);
        ctx.fillRect(0, 0, size, size);
        break;

      case 'esriSFSNull':
        break;

      default:
        throw new Error('Unknown SFS style: ' + symbol.style);
    }

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        size - symbol.outline.width, size - symbol.outline.width);
      ctx.stroke();
    }

    callback(null, ctx.canvas.toDataURL());
  },

  _renderLine: function(ctx, symbol, callback) {
    var size = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    ctx.beginPath();
    ctx.lineWidth = symbol.width;
    ctx.strokeStyle = this._formatColor(symbol.color);
    this._setDashArray(ctx, symbol); //

    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);

    ctx.closePath();
    ctx.stroke();
    callback(null, ctx.canvas.toDataURL());
  },

  _renderMarker: function(ctx, symbol, callback) {
    var xoffset = 0;
    var yoffset = 0;
    var size = symbol.size;
    var r, rx, ry;

    ctx.beginPath();

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      xoffset += symbol.outline.width;
      yoffset += symbol.outline.width;
    }

    this._setRotation(ctx, symbol.angle);

    switch (symbol.style) {
      case 'esriSMSCircle':
        ctx.fillStyle = this._formatColor(symbol.color);
        r = (size - 2 * xoffset) / 2;
        ctx.arc(r + xoffset, r + xoffset, r, 0, 2 * Math.PI, false);
        ctx.fill();
        break;

      case 'esriSMSX':
        ctx.moveTo(xoffset, yoffset);
        ctx.lineTo(size - xoffset, size - yoffset);
        ctx.moveTo(size - xoffset, yoffset);
        ctx.lineTo(xoffset, size - yoffset);
        break;

      case 'esriSMSCross':
        ctx.moveTo(xoffset, size / 2);
        ctx.lineTo(size - xoffset, size / 2);
        ctx.moveTo(size / 2, yoffset);
        ctx.lineTo(size / 2, size - yoffset);
        break;

      case 'esriSMSDiamond':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;

        ctx.moveTo(xoffset, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset + 2 * ry);
        ctx.lineTo(xoffset, yoffset + ry);
        ctx.fill();
        break;

      case 'esriSMSSquare':
        ctx.rect(xoffset, yoffset, size - 2 * xoffset, size - 2 * yoffset);
        break;

      case 'esriSMSTriangle':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;
        ctx.moveTo(xoffset, yoffset + ry * 2);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry * 2);
        ctx.lineTo(xoffset, yoffset + ry * 2);
        ctx.fill();
        break;

      default:
        throw new Error('Unknown esriSMS style: ' + symbol.style);
    }

    ctx.closePath();
    if (symbol.outline) {
      ctx.stroke();
    }
    callback(null, ctx.canvas.toDataURL());
  },

  _renderImageFill: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._fillImage(ctx, symbol.imageData, symbol, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        this._fillImage(ctx, null, symbol, symbol.contentType, image);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _renderImageMarker: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._drawImage(ctx, symbol.imageData, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        ctx.drawImage(image, 0, 0);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _setSize: function(ctx, symbol) {
    if (symbol.size) {
      ctx.width = ctx.height = symbol.size;
    } else if (symbol.type === 'esriSLS' ||
      symbol.type === 'esriSFS') {
      ctx.width = ctx.height = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    } else {
      ctx.width = symbol.width;
      ctx.height = symbol.height;
    }
  },

  _setRotation: function(ctx, angle) {
    ctx.rotate(-parseFloat(angle) * Math.PI / 180);
  },

  _setDashArray: function(ctx, symbol) {
    var dashArray = this._formatDashArray(symbol);
    if (dashArray.length) {
      ctx.setLineDash(dashArray);
    }
  },

  _drawCross: function(ctx, xoffset, yoffset, size) {
    ctx.moveTo(xoffset, yoffset);
    ctx.lineTo(size - xoffset, size - yoffset);
    ctx.moveTo(size - xoffset, yoffset);
    ctx.lineTo(xoffset, size - yoffset);
  },

  _hatchCanvas: function(ctx, size, color, width, offset) {
    var w = size * 2;
    var h = size * 2;

    for (var i = -w; i < w; i += offset) {
      ctx.moveTo(i, -h);
      ctx.lineTo(i, h);
    }

    ctx.lineWidth = width;
    ctx.strokeStyle = this._formatColor(color);
    ctx.stroke();
  },

  _formatColor: function(color) {
    return 'rgba(' + color.slice(0, 3).join(',') + ',' + color[3] / 255 + ')';
  },

  _formatDashArray: function(symbol) {
    var dashValues = [];

    switch (symbol.style) {
      case 'esriSLSDash':
        dashValues = [4, 3];
        break;
      case 'esriSLSDot':
        dashValues = [1, 3];
        break;
      case 'esriSLSDashDot':
        dashValues = [8, 3, 1, 3];
        break;
      case 'esriSLSDashDotDot':
        dashValues = [8, 3, 1, 3, 1, 3];
        break;
    }

    //use the dash values and the line weight to set dash array
    if (dashValues.length > 0) {
      for (var i = 0, len = dashValues.length; i < len; i++) {
        dashValues[i] *= symbol.width;
      }
    }

    return dashValues;
  },

  _getImageData: function(ctx, symbol) {
    return ctx.toDImageData(0, 0, symbol.width, symbol.height);
  },

  _fillImage: function(ctx, imageData, symbol, contentType, image) {
    var size = L.esri.Legend.DEFAULT_SIZE;
    var w = symbol.width || size;
    var h = symbol.height || size;
    if (imageData) {
      image = new Image();
      image.src = 'data:' + contentType + ';base64,' + imageData;
    }

    var pattern = ctx.createPattern(image, 'repeat');
    ctx.rect(0, 0, w, h);
    ctx.fillStyle = pattern;
    ctx.fill();

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        w - symbol.outline.width, h - symbol.outline.width);
      ctx.stroke();
    }
  },

  _drawImage: function(ctx, imageData, contentType) {
    var image = new Image();
    image.src = 'data:' + contentType + ';base64,' + imageData;
    ctx.drawImage(image, 0, 0);
  },

  _loadImage: function(url, callback, context) {
    var image = new Image();
    image.crossOrigin = '';
    image.onload = function() {
      callback.call(context, null, this);
    };
    image.onerror = function(e) {
      callback.call(context, {
        code: 500
      });
    };
    image.src = url + (url.indexOf('?') === -1 ? '?' : '&') +
      'nc=' + (new Date()).getTime();
  }

});


EsriLeaflet.DynamicMapLayer.include({

  legend: function(callback, context) {
    return this.service.legend(callback, context);
  }

});


EsriLeaflet.FeatureLayer.include({

  legend: function(callback, context) {
    return this.service.legend(callback, context);
  }

});


EsriLeaflet.LegendControl = L.Control.extend({

  options: {
    listTemplate: '<ul>{layers}</ul>',
    layerTemplate: '<li><strong>{layerName}</strong><ul>{legends}</ul></li>',
    listRowTemplate: '<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',
    emptyLabel: '<all values>',
    container: null
  },

  initialize: function(layers, options) {
    this._layers = L.Util.isArray(layers) ? layers : [layers];
    L.Control.prototype.initialize.call(this, options);
  },

  onAdd: function(map) {
    var container = this.options.container ||
        L.DomUtil.create('div', 'leaflet-legend-control leaflet-bar');
    L.DomEvent
      .disableScrollPropagation(container)
      .disableClickPropagation(container);

    if (this._layers.length) {
      this._load();
    }
    return container;
  },

  _load: function() {
    L.esri.Util.reduce(this._layers, {
      layers: []
    }, function(curr, layer, cb) {
      layer.legend(function(err, legend) {
        if (err) {
          return cb(err, curr);
        }
        curr.layers = curr.layers.concat(legend.layers);
        cb(null, curr);
      });
    }, this._onLoad, this);
  },

  _onLoad: function(error, legend) {
    if (!error) {
      var layersHtml = '';
      for (var i = 0, len = legend.layers.length; i < len; i++) {
        var layer = legend.layers[i];
        var legendsHtml = '';
        for (var j = 0, jj = layer.legend.length; j < jj; j++) {
          var layerLegend = JSON.parse(JSON.stringify(layer.legend[j]));
          this._validateLegendLabel(layerLegend);
          legendsHtml += L.Util.template(this.options.listRowTemplate, layerLegend);
        }
        layersHtml += L.Util.template(this.options.layerTemplate, {
          layerName: layer.layerName,
          legends: legendsHtml
        });
      }
      this._container.innerHTML = L.Util.template(this.options.listTemplate, {
        layers: layersHtml
      });
    }
  },

  _validateLegendLabel: function(layerLegend) {
    if (!layerLegend.label && this.options.emptyLabel) {
      layerLegend.label = this.options.emptyLabel;
    }
    layerLegend.label = layerLegend.label.replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

});

EsriLeaflet.legendControl = function(layers, options) {
  return new L.esri.LegendControl(layers, options);
};


  return EsriLeaflet;
}));
//# sourceMappingURL=esri-leaflet-legend-compat-src.js.map