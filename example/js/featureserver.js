var map = L.map('map', {
  maxZoom: 20
}).setView([41.78408507289525, -88.13716292381285], 18);

L.esri.basemapLayer('Gray').addTo(map);

var ids = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23];
var layers = ids.map(function(id) {
  return L.esri.featureLayer({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Water_Network/FeatureServer/' + id,
      useCors: false
    }).addTo(map);
});

layers.push(new L.esri.featureLayer({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Military/FeatureServer/3',
    useCors: false
  }).addTo(map));

L.esri.legendControl(layers).addTo(map);
