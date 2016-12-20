describe('L.esri.Legend', function() {
  function createMap() {
    // create container
    var container = document.createElement('div');

    // give container a width/height
    container.setAttribute('style', 'width:500px; height: 500px;');

    // add contianer to body
    document.body.appendChild(container);

    return L.map(container).setView([45.51, -122.66], 16);
  }

  var server;
  var task;

  // create map
  var map = createMap();

  var latlng = map.getCenter();
  var rawLatlng = [45.51, -122.66];

  var mapServiceUrl = 'http://services.arcgis.com/mock/arcgis/rest/services/MockMapService/MapServer/';

  var sampleResponse = {
    "layers": [{
      "layerId": 2,
      "layerName": "Water Abandoned Points",
      "layerType": "Feature Layer",
      "minScale": 0,
      "maxScale": 0,
      "legend": [{
        "label": "",
        "url": "95e051377403211bc794fa8e4e919978",
        "imageData": "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAdlJREFUOI291M9LFGEcx/H3V7cdfxW1JQQRG16UjQhCLRyDLmEHwbOIERSh/QNdCreiQwcvQihRoH9AdQu8VjuIQpdAhULyIBr5C2nTp7H9dpkpn91nxUL8wMDwPM/3Nd+HmXkS7HMSBw8GeiQFmbxSlxKWFvNMc1UK/w4GmkF5iNK1Gq1bVKCGbwT6lEoGuSjf9wYG2ovyHEg6ZutRst423ea9dtIun3cFvUCvGWUUqCjbPWCgEWGcCW3lkqy4wQ9aZTZ5FmNtCbh7Ehrq4GcBJlehf9mqaKCgj4A7bnCLbuA0QFcSXpyF49V/py+cgOZj0PJpR43KLSb0ftylDap2gAAwcMbG4jTXw/Ca1ekhfnEFeFkKIun4ruloKRanNQXYW/9TZ4NCiEaP3eWVJIvnhNANqs6AXAZYyEP6sBucK/r6PGXWuEAPeWXgNsDoPNzLQGVRNyub8GTJGlo2wltnh8aXcXKaA/zsBjANN9JwqhbCAsyuw4MvEGxb4GPaxDjBKNeBKSCV3YDsR/e2o7zhB0M7B0pBX+bIabsHrw00lrd0jGrpw7cPCve/7MuMmdJzhNxE6QHOA7XAV9B3HjJk/Iqcq7T8adMiITASXVZM6eo9gP+ZfQd/AxBNj/i1bQYFAAAAAElFTkSuQmCC",
        "contentType": "image/png",
        "height": 20,
        "width": 20
      }]
    }]
  };

  beforeEach(function() {
    server = sinon.fakeServer.create();
    task = L.esri.legend({
      url: mapServiceUrl
    });
  });

  afterEach(function() {
    server.restore();
  });

  it('should identify features', function(done) {
    var request = task.run(function(error, legend) {
      expect(legend).to.deep.equal(sampleResponse);
      done();
    });

    expect(request.url).to.contain(mapServiceUrl + 'legend');
    expect(request.url).to.contain('f=json');
    request.respond(200, {
      'Content-Type': 'text/plain; charset=utf-8'
    }, JSON.stringify(sampleResponse));
  });

  it('should request legend with a token', function(done) {
    // server.respondWith('GET', url + 'legend?token=foo&f=json', JSON.stringify(sampleResponse));

    var request = task.token('foo').run(function(error, legend, raw) {
      expect(legend).to.deep.equal(sampleResponse);
      done();
    });

    expect(request.url).to.contain('token=foo');

    request.respond(200, {
      'Content-Type': 'text/plain; charset=utf-8'
    }, JSON.stringify(sampleResponse));
  });

  it('should use a service to execute the request', function(done) {
    var service = L.esri.mapService({
      url: mapServiceUrl
    });

    // server.respondWith('GET', url + 'legend?f=json', JSON.stringify(sampleResponse));

    var request = service.legend(function(error, legend) {
      expect(legend).to.deep.equal(sampleResponse);
      done();
    });

    expect(request.url).to.contain('f=json');

    request.respond(200, {
      'Content-Type': 'text/plain; charset=utf-8'
    }, JSON.stringify(sampleResponse));
  });

});
