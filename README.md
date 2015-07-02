# Esri Leaflet Legend

Esri leaflet plugin for retrieving map service legends. Also aimed to cover the
lack of similar API for FeatureServers and render the symbols from layer definitions.
No assumptions on how you want to render the legend, you are simply getting the
legend data([see format](http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r3000000pm000000)). There is a templating example in the [demo](https://w8r.github.io/esri-leaflet-legend/example/).

**The legend task for mapservers is ready & tested, feature layers part is developed
separately and will be released later**

### [Example](https://w8r.github.io/esri-leaflet-legend/example/)

### Approach with symbols

For featureservers(and ArcGIS servers <= 10.0 with no `legend` API) I want to mimic
the API with the data taken from layer definitions. So the symbols have to be rendered
into `<canvas>` and exported as base64. But `esriPMS` and `esriPFS` symbols are
problematic: I can't get CORS patterns to work, no solution with avoiding cacheing
or '<img crossOrigin=''>` seem to work. Suggestions are appreciated.

### Development Instructions

Make sure you have the [Grunt CLI](http://gruntjs.com/getting-started) installed.

1. [Fork and clone Esri Leaflet Renderers](https://help.github.com/articles/fork-a-repo)
2. `cd` into the `esri-leaflet-legend` folder
5. Install the dependencies with `npm install`
5. run `grunt` from the command line. This will create minified source, run linting, and start watching the source files for changes.
6. Make your changes and create a [pull request](https://help.github.com/articles/creating-a-pull-request)

### Dependencies

* Leaflet version 0.7 or higher is required but the latest version is recommended.
* Esri Leaflet

### Licensing

MIT

