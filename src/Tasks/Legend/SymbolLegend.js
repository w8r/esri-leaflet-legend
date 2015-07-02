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
