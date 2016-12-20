EsriLeaflet.MapService.include({

  legend: function(callback, context) {
    return new EsriLeaflet.Legend(this).run(callback, context);
  }

});
