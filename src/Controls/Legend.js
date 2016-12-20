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
