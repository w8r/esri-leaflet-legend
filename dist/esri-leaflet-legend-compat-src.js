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

EsriLeaflet.Services.MapService.include({

  legend: function(callback, context) {
    return new EsriLeaflet.Tasks.Legend(this).run(callback, context);
  }

});


EsriLeaflet.Tasks.Legend = EsriLeaflet.Tasks.Task.extend({
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

EsriLeaflet.Tasks.legend = function(params) {
  return new EsriLeaflet.Tasks.Legend(params);
};


EsriLeaflet.Tasks.Legend.include({

  initialize: function(endpoint) {
    this._renderer = new EsriLeaflet.Tasks.Legend.SymbolRenderer();
    EsriLeaflet.Tasks.Task.prototype.initialize.call(this, endpoint);
  },

  run: function(callback, context) {
    function cb(error, response) {
      if (error && error.error.code === 400) { // ArcGIS server >=10.0
        this._collectLegendFromLayers(callback, context);
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
    var layer = layerDefs.pop();
    var layerData = [];

    if (!layer) {
      callback.call(this, null, layerData);
    }

    // queue
    function layerDataReceived(err, data) {
      if (err) {
        callback.call(context, err);
      } else {
        layerData.push(data);
        layer = layerDefs.pop();
        if (layer) {
          this._getLayerLegend(layer, layerDataReceived, this);
        } else {
          callback.call(context, null, layerData);
        }
      }
    }
    this._getLayerLegend(layer, layerDataReceived, this);
  },

  _getLayerLegend: function(layer, callback, context) {
    this._service.request(layer.id, {
      f: 'json'
    }, callback, context);
  },

  _symbolsToLegends: function(layerData, callback, context) {
    var result = [];
    var layer = layerData.pop();

    function legendReady(err, legend) {
      if (err) {
        callback.call(context, err);
      }
      result.push({
        layerId: layer.id,
        layerType: layer.type,
        layerName: layer.name,
        maxScale: layer.maxScale,
        minScale: layer.minScale,
        legend: legend
      });

      layer = layerData.pop();
      if (layer) {
        this._drawingInfoToLegend(layer.drawingInfo, legendReady, this);
      } else {
        callback.call(context, null, result);
      }
    }

    if (layer) {
      this._drawingInfoToLegend(layer.drawingInfo, legendReady, this);
    }
    return result;
  },

  _drawingInfoToLegend: function(drawingInfo, callback, context) {
    var uniqueValueInfos = drawingInfo.renderer.type === 'uniqueValue' ?
      drawingInfo.renderer.uniqueValueInfos.slice() :
      [drawingInfo.renderer];
    var legend = [];
    var symbol = uniqueValueInfos.pop();

    function symbolRendered(error, image) {
      if (error) {
        return callback.call(context, error);
      }

      legend.push({
        label: symbol.label,
        height: image.height,
        url: symbol.symbol.url,
        imageData: image.imageData,
        contentType: image.contentType,
        width: image.width,
        values: [symbol.value || '']
      });

      symbol = uniqueValueInfos.pop();
      if (symbol) {
        this._renderSymbol(symbol, symbolRendered, this);
      } else {
        callback.call(context, null, legend);
      }
    }

    if (symbol) {
      this._renderSymbol(symbol, symbolRendered, this);
    }
  },

  _renderSymbol: function(symbol, callback, context) {
    return this._renderer.render(symbol.symbol, callback, context);
  }

});


EsriLeaflet.Tasks.Legend.SymbolRenderer = L.Class.extend({

  statics: {
    SYMBOL_TYPES: {
      MARKER: 'esriSMS',
      LINE: 'esriSLS',
      FILL: 'esriSFS',
      PICTURE_MARKER: 'esriPMS',
      PICTURE_FILL: 'esriPFS',
      TEXT: 'esriTS'
    }
  },

  render: function(symbol, callback, context) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var imageData = symbol.imageData;

    function done(error, imageData) {
      if (error) {
        callback.call(context, error);
      } else {
        callback.call(context, null, {
          width: symbol.width,
          height: symbol.height,
          imageData: imageData,
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
    console.log(symbol);
    this._setSize(ctx, symbol);
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderFill: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderLine: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);

    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderMarker: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);
    if (symbol.outline) {
      this._setOutline(ctx, symbol.outline);
    }
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderImageFill: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._fillImage(ctx, symbol.imageData, symbol, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        this._fillImage(ctx, null, symbol, symbol.contentType, image);
        callback(null, ctx.toDataURL());
      }, this);
    }
  },

  _renderImageMarker: function(ctx, symbol, callback) {
    this._setSize(ctx, symbol);
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._drawImage(ctx, symbol.imageData, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        ctx.drawImage(image, 0, 0);
        callback(null, ctx.toDataURL());
      }, this);
    }
  },

  _setSize: function(ctx, symbol) {
    ctx.width = symbol.width;
    ctx.height = symbol.height;
  },

  _setRotation: function(ctx, angle) {
    ctx.rotate(-parseFloat(angle) * Math.PI / 180);
  },

  _getImageData: function(ctx, symbol) {
    return ctx.toDImageData(0, 0, symbol.width, symbol.height);
  },

  _fillImage: function(ctx, imageData, size, contentType, image) {
    if (imageData) {
      image = new Image();
      image.src = 'data:' + contentType + ';base64,' + imageData;
    }

    var pattern = ctx.createPattern(image, 'repeat');
    ctx.rect(0, 0, size.width, size.height);
    ctx.fillStyle = pattern;
    ctx.fill();
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


EsriLeaflet.Layers.DynamicMapLayer.include({

  legend: function(callback, context) {
    return this._service.legend(callback, context);
  }

});


EsriLeaflet.Layers.FeatureLayer.include({

  legend: function() {
    return this._service.legend();
  }

});


  return EsriLeaflet;
}));
//# sourceMappingURL=esri-leaflet-legend-compat-src.js.map