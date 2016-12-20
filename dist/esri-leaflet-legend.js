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


EsriLeaflet.Util.reduce=function(a,b,c,d,e){function f(b){for(var h=!0,i=b;i<a.length;i++){var j=!1;if(c(g,a[i],function(a,b){return a?d.call(e,a,g):(j=!0,g=b,void(h||f(i+1)))}),h=j,!h)return}d.call(e,null,g)}var g=b;f(0)},EsriLeaflet.MapService.include({legend:function(a,b){return new EsriLeaflet.Legend(this).run(a,b)}}),EsriLeaflet.Legend=EsriLeaflet.Task.extend({path:"legend",params:{f:"json"},run:function(a,b){return this._service?this._service.request(this.path,this.params,a,b):this._request("request",this.path,this.params,a,b)}}),EsriLeaflet.legend=function(a){return new EsriLeaflet.Legend(a)},EsriLeaflet.DynamicMapLayer.include({legend:function(a,b){return this.service.legend(a,b)}}),EsriLeaflet.LegendControl=L.Control.extend({options:{listTemplate:"<ul>{layers}</ul>",layerTemplate:"<li><strong>{layerName}</strong><ul>{legends}</ul></li>",listRowTemplate:'<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',emptyLabel:"<all values>",container:null},initialize:function(a,b){this._layers=L.Util.isArray(a)?a:[a],L.Control.prototype.initialize.call(this,b)},onAdd:function(a){var b=this.options.container||L.DomUtil.create("div","leaflet-legend-control leaflet-bar");return L.DomEvent.disableScrollPropagation(b).disableClickPropagation(b),this._layers.length&&this._load(),b},_load:function(){L.esri.Util.reduce(this._layers,{layers:[]},function(a,b,c){b.legend(function(b,d){return b?c(b,a):(a.layers=a.layers.concat(d.layers),void c(null,a))})},this._onLoad,this)},_onLoad:function(a,b){if(!a){for(var c="",d=0,e=b.layers.length;d<e;d++){for(var f=b.layers[d],g="",h=0,i=f.legend.length;h<i;h++){var j=JSON.parse(JSON.stringify(f.legend[h]));this._validateLegendLabel(j),g+=L.Util.template(this.options.listRowTemplate,j)}c+=L.Util.template(this.options.layerTemplate,{layerName:f.layerName,legends:g})}this._container.innerHTML=L.Util.template(this.options.listTemplate,{layers:c})}},_validateLegendLabel:function(a){!a.label&&this.options.emptyLabel&&(a.label=this.options.emptyLabel),a.label=a.label.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}}),EsriLeaflet.legendControl=function(a,b){return new L.esri.LegendControl(a,b)};
//# sourceMappingURL=esri-leaflet-legend.js.map

  return EsriLeaflet;
}));