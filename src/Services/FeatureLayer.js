EsriLeaflet.Services.FeatureLayer.include({

  legend: function(callback, context) {
    return new EsriLeaflet.Tasks.Legend(this).run(callback, context);
  }

});
