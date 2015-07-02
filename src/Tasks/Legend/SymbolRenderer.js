EsriLeaflet.Tasks.Legend.SymbolRenderer = L.Class.extend({

  statics: {
    SYMBOL_TYPES: {
      MARKER: 'esriSMS',
      LINE: 'esriSLS',
      FILL: 'esriSFS',
      PICTURE_MARKER: 'esriPMS',
      PICTURE_FILL: 'esriPFS',
      TEXT: 'esriTS'
    }
  },

  render: function(symbol, callback, context) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var imageData = symbol.imageData;

    function done(error, imageData) {
      if (error) {
        callback.call(context, error);
      } else {
        callback.call(context, null, {
          width: symbol.width,
          height: symbol.height,
          imageData: imageData,
          url: null,
          contentType: 'image/png'
        });
      }
    }

    if (symbol.imageData) {
      return done(null, symbol.imageData);
    }

    switch (symbol.type) {
      case 'esriSMS':
        this._renderMarker(ctx, symbol, done);
        break;
      case 'esriSLS':
        this._renderLine(ctx, symbol, done);
        break;
      case 'esriSFS':
        this._renderFill(ctx, symbol, done);
        break;
      case 'esriPMS':
        this._renderImageMarker(ctx, symbol, done);
        break;
      case 'esriPFS':
        this._renderImageFill(ctx, symbol, done);
        break;
      case 'esriST':
        this._renderText(ctx, symbol, done);
        break;
      default:
        break;
    }
  },

  _renderText: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderFill: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderLine: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);

    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderMarker: function(ctx, symbol, callback) {
    console.log(symbol);
    this._setSize(ctx, symbol);
    if (symbol.outline) {
      this._setOutline(ctx, symbol.outline);
    }
    callback(null, ctx.getImageData(0, 0, symbol.width, symbol.height));
  },

  _renderImageFill: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._fillImage(ctx, symbol.imageData, symbol, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        this._fillImage(ctx, null, symbol, symbol.contentType, image);
        callback(null, ctx.toDataURL());
      }, this);
    }
  },

  _renderImageMarker: function(ctx, symbol, callback) {
    this._setSize(ctx, symbol);
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._drawImage(ctx, symbol.imageData, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        ctx.drawImage(image, 0, 0);
        callback(null, ctx.toDataURL());
      }, this);
    }
  },

  _setSize: function(ctx, symbol) {
    ctx.width = symbol.width;
    ctx.height = symbol.height;
  },

  _setRotation: function(ctx, angle) {
    ctx.rotate(-parseFloat(angle) * Math.PI / 180);
  },

  _getImageData: function(ctx, symbol) {
    return ctx.toDImageData(0, 0, symbol.width, symbol.height);
  },

  _fillImage: function(ctx, imageData, size, contentType, image) {
    if (imageData) {
      image = new Image();
      image.src = 'data:' + contentType + ';base64,' + imageData;
    }

    var pattern = ctx.createPattern(image, 'repeat');
    ctx.rect(0, 0, size.width, size.height);
    ctx.fillStyle = pattern;
    ctx.fill();
  },

  _drawImage: function(ctx, imageData, contentType) {
    var image = new Image();
    image.src = 'data:' + contentType + ';base64,' + imageData;
    ctx.drawImage(image, 0, 0);
  },

  _loadImage: function(url, callback, context) {
    var image = new Image();
    image.crossOrigin = '';
    image.onload = function() {
      callback.call(context, null, this);
    };
    image.onerror = function(e) {
      callback.call(context, {
        code: 500
      });
    };
    image.src = url + (url.indexOf('?') === -1 ? '?' : '&') +
      'nc=' + (new Date()).getTime();
  }

});
