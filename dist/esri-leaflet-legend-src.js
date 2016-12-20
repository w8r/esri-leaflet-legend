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


EsriLeaflet.DynamicMapLayer.include({

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
//# sourceMappingURL=esri-leaflet-legend-src.js.map