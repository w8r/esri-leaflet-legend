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
