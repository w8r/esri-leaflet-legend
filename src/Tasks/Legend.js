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
