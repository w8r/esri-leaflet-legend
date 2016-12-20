EsriLeaflet.FeatureLayerService.include({

  legend: function(callback, context) {
    return new L.esri.Legend(this).run(callback, context);
  }

});
