var map = L.map('map', {
  maxZoom: 20
}).setView([41.78408507289525, -88.13716292381285], 18);

L.esri.basemapLayer('Gray').addTo(map);

var waterNetwork = L.esri.dynamicMapLayer({
    url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Water_Network/MapServer',
    useCors: false
  }).addTo(map);

L.esri.legendControl(waterNetwork).addTo(map);
