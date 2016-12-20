describe('L.esri.DynamicMapLayer', function() {

  function createMap() {
    // create container
    var container = document.createElement('div');

    // give container a width/height
    container.setAttribute('style', 'width:500px; height: 500px;');

    // add contianer to body
    document.body.appendChild(container);

    return L.map(container).setView([37.75, -122.45], 12);
  }

  var url = 'http://services.arcgis.com/mock/arcgis/rest/services/MockMapService/MapServer';
  var layer;
  var server;
  var map;


  beforeEach(function() {
    server = sinon.fakeServer.create();
    layer = L.esri.dynamicMapLayer({
      url: url,
      f: 'json'
    });
    map = createMap();
  });

  afterEach(function() {
    server.restore();
    map.remove();
  });

  it('should expose the legend method on the underlying service', function(done) {
    var spy = sinon.spy(layer.service, 'legend');
    server.respondWith('GET',
      'http://services.arcgis.com/mock/arcgis/rest/services/MockMapService/MapServer/legend?f=json', JSON.stringify({
        foo: 'bar'
      }));

    layer.legend(function(error, response) {
      expect(response).to.deep.equal({
        foo: 'bar'
      });
      done();
    });

    server.respond();
  });

});
