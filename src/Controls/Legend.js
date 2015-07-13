EsriLeaflet.Controls.Legend = L.Control.extend({

  initialize: function(layers, options) {
    this._layers = L.Util.isArray(layers) ? layers : [layers];
    L.Control.prototype.initialize.call(this, options);
  },

  onAdd: function(map) {
    var container = L.DomUtil.create('div', 'leaflet-legend-control leaflet-bar');
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
      var html = '<ul>';
      for (var i = 0, len = legend.layers.length; i < len; i++) {
        html += '<li><strong>' + legend.layers[i].layerName + '</strong><ul>';
        for (var j = 0, jj = legend.layers[i].legend.length; j < jj; j++) {
          var layerLegend = legend.layers[i].legend[j];
          this._validateLegendLabel(layerLegend);
          html += L.Util.template(
            '<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',
            layerLegend);
        }
        html += '</ul></li>';
      }
      html += '</ul>';
      this._container.innerHTML = html;
    }
  },

  _validateLegendLabel: function(layerLegend) {
    if (!layerLegend.label) {
      layerLegend.label = '<all values>';
    }
    layerLegend.label = layerLegend.label.replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

});

EsriLeaflet.Controls.legend = function(layers, options) {
  return new L.esri.Controls.Legend(layers, options);
};
