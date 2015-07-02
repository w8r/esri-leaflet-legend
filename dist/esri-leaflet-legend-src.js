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


EsriLeaflet.Layers.DynamicMapLayer.include({

  legend: function(callback, context) {
    return this._service.legend(callback, context);
  }

});


  return EsriLeaflet;
}));
//# sourceMappingURL=esri-leaflet-legend-src.js.map