# Esri Leaflet Legend  [![npm version](https://badge.fury.io/js/esri-leaflet-legend.svg)](https://badge.fury.io/js/esri-leaflet-legend) [![CircleCI](https://circleci.com/gh/w8r/esri-leaflet-legend.svg?style=svg)](https://circleci.com/gh/w8r/esri-leaflet-legend)

Esri leaflet plugin for retrieving map service legends. Also aimed to cover the
lack of similar API for FeatureServers and render the symbols from layer definitions.
No assumptions on how you want to render the legend, you are simply getting the
legend data([see format](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000pm000000)). There is a templating example in the [demo](https://w8r.github.io/esri-leaflet-legend/example/).

**The legend task for mapservers is ready & tested, feature layers part is developed
separately and will be released later**

### [Example](https://w8r.github.io/esri-leaflet-legend/example/)

* [Example with feature layers](https://w8r.github.io/esri-leaflet-legend/example/featureserver.html)

```js
var map = L.map('map', {maxZoom: 20}).setView([ 41.78408507289525, -88.13716292381285], 18);

L.esri.basemapLayer('Gray').addTo(map);

var waterNetwork = L.esri.dynamicMapLayer(
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Water_Network/MapServer', {
    useCors: false
}).addTo(map);

waterNetwork.legend(function(error, legend){
    if(!error) {
        var html = '<ul>';
        for(var i = 0, len = legend.layers.length; i < len; i++) {
            html += '<li><strong>' + legend.layers[i].layerName + '</strong><ul>';
            for(var j = 0, jj = legend.layers[i].legend.length; j < jj; j++){
                html += L.Util.template('<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>', legend.layers[i].legend[j]);
            }
            html += '</ul></li>';
        }
        html+='</ul>';
        document.getElementById('legend').innerHTML = html;
    }
});
```

### Legend Control

`L.esri.Controls.Legend` will render symbology for a single or multiple layers,
loading the data and rendering it in a queue. That can take some time, but it's
a lot of requests(one per each feature layer).

```js
var map = L.map('map').setView([...], 12);
L.esri.Controls.legend([dynamicLayer, featureLayer], {position: 'topright'}).addTo(map);
```

You can also adjust the templates for legend output:

```js
{
    listTemplate: '<ul>{layers}</ul>',
    layerTemplate: '<li><strong>{layerName}</strong><ul>{legends}</ul></li>',
    listRowTemplate: '<li><img width="{width}" \
                               height="{height}" \
                               src="data:{contentType};base64,{imageData}">\
                           <span>{label}</span>\
                      </li>',
    emptyLabel: '<all values>'
}
```

### Legend task

```js
var f = new L.esri.Layers.FeatureLayer('/some/arcgis/rest/services/xxx/FeatureServer/0', {}).addTo(map);
f.legend(function(error, legend) {  /* same format as /legend API */  });
// or
var m = L.esri.Services.MapService('some/MapServer/', {});
m.legend(function(error, legend) {  /* same format as /legend API */  });
```

### Approach with symbols

For featureservers(and ArcGIS servers <= 10.0 with no `legend` API) I want to mimic
the API with the data taken from layer definitions. So the symbols have to be rendered
into `<canvas>` and exported as base64. But `esriPMS` and `esriPFS` symbols are
problematic: I can't get CORS patterns to work, no solution with avoiding cacheing
or `<img crossOrigin=''>` seem to work. Suggestions are appreciated.

`esriST` is not implemented yet - cannot find a working example.

### Development Instructions

Make sure you have the [Grunt CLI](http://gruntjs.com/getting-started) installed.

1. [Fork and clone](https://help.github.com/articles/fork-a-repo)
2. `cd` into the `esri-leaflet-legend` folder
5. Install the dependencies with `npm install`
5. run `grunt` from the command line. This will create minified source, run linting, and start watching the source files for changes.
6. Make your changes and create a [pull request](https://help.github.com/articles/creating-a-pull-request)

### Dependencies

* Leaflet version 0.7 or higher is required but the latest version is recommended.
* [Esri-Leaflet](https://github.com/esri/esri-leaflet/)
* Probably, [Esri-leaflet-renderers](https://github.com/esri/esri-leaflet-renderers/) for feature layers

### Licensing

MIT

