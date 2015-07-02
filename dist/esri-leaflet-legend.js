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


EsriLeaflet.Services.MapService.include({legend:function(a,b){return new EsriLeaflet.Tasks.Legend(this).run(a,b)}}),EsriLeaflet.Tasks.Legend=EsriLeaflet.Tasks.Task.extend({path:"legend",params:{f:"json"},run:function(a,b){return this._service?this._service.request(this.path,this.params,a,b):this._request("request",this.path,this.params,a,b)}}),EsriLeaflet.Tasks.legend=function(a){return new EsriLeaflet.Tasks.Legend(a)},EsriLeaflet.Layers.DynamicMapLayer.include({legend:function(a,b){return this._service.legend(a,b)}});
//# sourceMappingURL=esri-leaflet-legend.js.map

  return EsriLeaflet;
}));