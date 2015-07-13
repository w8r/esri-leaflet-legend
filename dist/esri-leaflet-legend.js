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


EsriLeaflet.Util.reduce=function(a,b,c,d,e){function f(b){for(var h=!0,i=b;i<a.length;i++){var j=!1;if(c(g,a[i],function(a,b){return a?d.callback(e,a,g):(j=!0,g=b,void(h||f(i+1)))}),h=j,!h)return}d.call(e,null,g)}var g=b;f(0)},EsriLeaflet.Services.MapService.include({legend:function(a,b){return new EsriLeaflet.Tasks.Legend(this).run(a,b)}}),EsriLeaflet.Tasks.Legend=EsriLeaflet.Tasks.Task.extend({path:"legend",params:{f:"json"},run:function(a,b){return this._service?this._service.request(this.path,this.params,a,b):this._request("request",this.path,this.params,a,b)}}),EsriLeaflet.Tasks.legend=function(a){return new EsriLeaflet.Tasks.Legend(a)},EsriLeaflet.Layers.DynamicMapLayer.include({legend:function(a,b){return this._service.legend(a,b)}}),EsriLeaflet.Controls.Legend=L.Control.extend({initialize:function(a,b){this._layers=L.Util.isArray(a)?a:[a],L.Control.prototype.initialize.call(this,b)},onAdd:function(a){var b=L.DomUtil.create("div","leaflet-legend-control leaflet-bar");return L.DomEvent.disableScrollPropagation(b).disableClickPropagation(b),this._layers.length&&this._load(),b},_load:function(){L.esri.Util.reduce(this._layers,{layers:[]},function(a,b,c){b.legend(function(b,d){return b?c(b,a):(a.layers=a.layers.concat(d.layers),void c(null,a))})},this._onLoad,this)},_onLoad:function(a,b){if(!a){for(var c="<ul>",d=0,e=b.layers.length;e>d;d++){c+="<li><strong>"+b.layers[d].layerName+"</strong><ul>";for(var f=0,g=b.layers[d].legend.length;g>f;f++){var h=b.layers[d].legend[f];this._validateLegendLabel(h),c+=L.Util.template('<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',h)}c+="</ul></li>"}c+="</ul>",this._container.innerHTML=c}},_validateLegendLabel:function(a){a.label||(a.label="<all values>"),a.label=a.label.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}}),EsriLeaflet.Controls.legend=function(a,b){return new L.esri.Controls.Legend(a,b)};
//# sourceMappingURL=esri-leaflet-legend.js.map

  return EsriLeaflet;
}));