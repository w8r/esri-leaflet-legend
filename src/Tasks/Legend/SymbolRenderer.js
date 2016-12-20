EsriLeaflet.Legend.SymbolRenderer = L.Class.extend({

  statics: {
    SYMBOL_TYPES: {
      MARKER: 'esriSMS',
      LINE: 'esriSLS',
      FILL: 'esriSFS',
      PICTURE_MARKER: 'esriPMS',
      PICTURE_FILL: 'esriPFS',
      TEXT: 'esriTS'
    },
    DEFAULT_SIZE: 20
  },

  render: function(symbol, callback, context) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var imageData = symbol.imageData;
    this._setSize(canvas, symbol);

    function done(error, imageData) {
      if (error) {
        callback.call(context, error);
      } else {
        callback.call(context, null, {
          width: canvas.width || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          height: canvas.height || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          imageData: imageData.replace('data:image/png;base64,', ''),
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
    callback(null, ctx.canvas.toDataURL());
  },

  _renderFill: function(ctx, symbol, callback) {
    var size = EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE;
    var lineWidth = symbol.outline ? symbol.outline.width : 1;
    var lineOffset = Math.max(5, lineWidth * 3);
    switch (symbol.style) {

      case 'esriSFSVertical':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSHorizontal':
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSBackwardDiagonal':
        this._setRotation(ctx, -45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSForwardDiagonal':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSCross':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSDiagonalCross':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSSolid':
        ctx.fillStyle = this._formatColor(symbol.color);
        ctx.fillRect(0, 0, size, size);
        break;

      case 'esriSFSNull':
        break;

      default:
        throw new Error('Unknown SFS style: ' + symbol.style);
    }

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        size - symbol.outline.width, size - symbol.outline.width);
      ctx.stroke();
    }

    callback(null, ctx.canvas.toDataURL());
  },

  _renderLine: function(ctx, symbol, callback) {
    var size = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    ctx.beginPath();
    ctx.lineWidth = symbol.width;
    ctx.strokeStyle = this._formatColor(symbol.color);
    this._setDashArray(ctx, symbol); //

    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);

    ctx.closePath();
    ctx.stroke();
    callback(null, ctx.canvas.toDataURL());
  },

  _renderMarker: function(ctx, symbol, callback) {
    var xoffset = 0;
    var yoffset = 0;
    var size = symbol.size;
    var r, rx, ry;

    ctx.beginPath();

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      xoffset += symbol.outline.width;
      yoffset += symbol.outline.width;
    }

    this._setRotation(ctx, symbol.angle);

    switch (symbol.style) {
      case 'esriSMSCircle':
        ctx.fillStyle = this._formatColor(symbol.color);
        r = (size - 2 * xoffset) / 2;
        ctx.arc(r + xoffset, r + xoffset, r, 0, 2 * Math.PI, false);
        ctx.fill();
        break;

      case 'esriSMSX':
        ctx.moveTo(xoffset, yoffset);
        ctx.lineTo(size - xoffset, size - yoffset);
        ctx.moveTo(size - xoffset, yoffset);
        ctx.lineTo(xoffset, size - yoffset);
        break;

      case 'esriSMSCross':
        ctx.moveTo(xoffset, size / 2);
        ctx.lineTo(size - xoffset, size / 2);
        ctx.moveTo(size / 2, yoffset);
        ctx.lineTo(size / 2, size - yoffset);
        break;

      case 'esriSMSDiamond':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;

        ctx.moveTo(xoffset, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset + 2 * ry);
        ctx.lineTo(xoffset, yoffset + ry);
        ctx.fill();
        break;

      case 'esriSMSSquare':
        ctx.rect(xoffset, yoffset, size - 2 * xoffset, size - 2 * yoffset);
        break;

      case 'esriSMSTriangle':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;
        ctx.moveTo(xoffset, yoffset + ry * 2);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry * 2);
        ctx.lineTo(xoffset, yoffset + ry * 2);
        ctx.fill();
        break;

      default:
        throw new Error('Unknown esriSMS style: ' + symbol.style);
    }

    ctx.closePath();
    if (symbol.outline) {
      ctx.stroke();
    }
    callback(null, ctx.canvas.toDataURL());
  },

  _renderImageFill: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._fillImage(ctx, symbol.imageData, symbol, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        this._fillImage(ctx, null, symbol, symbol.contentType, image);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _renderImageMarker: function(ctx, symbol, callback) {
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._drawImage(ctx, symbol.imageData, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        ctx.drawImage(image, 0, 0);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _setSize: function(ctx, symbol) {
    if (symbol.size) {
      ctx.width = ctx.height = symbol.size;
    } else if (symbol.type === 'esriSLS' ||
      symbol.type === 'esriSFS') {
      ctx.width = ctx.height = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    } else {
      ctx.width = symbol.width;
      ctx.height = symbol.height;
    }
  },

  _setRotation: function(ctx, angle) {
    ctx.rotate(-parseFloat(angle) * Math.PI / 180);
  },

  _setDashArray: function(ctx, symbol) {
    var dashArray = this._formatDashArray(symbol);
    if (dashArray.length) {
      ctx.setLineDash(dashArray);
    }
  },

  _drawCross: function(ctx, xoffset, yoffset, size) {
    ctx.moveTo(xoffset, yoffset);
    ctx.lineTo(size - xoffset, size - yoffset);
    ctx.moveTo(size - xoffset, yoffset);
    ctx.lineTo(xoffset, size - yoffset);
  },

  _hatchCanvas: function(ctx, size, color, width, offset) {
    var w = size * 2;
    var h = size * 2;

    for (var i = -w; i < w; i += offset) {
      ctx.moveTo(i, -h);
      ctx.lineTo(i, h);
    }

    ctx.lineWidth = width;
    ctx.strokeStyle = this._formatColor(color);
    ctx.stroke();
  },

  _formatColor: function(color) {
    return 'rgba(' + color.slice(0, 3).join(',') + ',' + color[3] / 255 + ')';
  },

  _formatDashArray: function(symbol) {
    var dashValues = [];

    switch (symbol.style) {
      case 'esriSLSDash':
        dashValues = [4, 3];
        break;
      case 'esriSLSDot':
        dashValues = [1, 3];
        break;
      case 'esriSLSDashDot':
        dashValues = [8, 3, 1, 3];
        break;
      case 'esriSLSDashDotDot':
        dashValues = [8, 3, 1, 3, 1, 3];
        break;
    }

    //use the dash values and the line weight to set dash array
    if (dashValues.length > 0) {
      for (var i = 0, len = dashValues.length; i < len; i++) {
        dashValues[i] *= symbol.width;
      }
    }

    return dashValues;
  },

  _getImageData: function(ctx, symbol) {
    return ctx.toDImageData(0, 0, symbol.width, symbol.height);
  },

  _fillImage: function(ctx, imageData, symbol, contentType, image) {
    var size = L.esri.Legend.DEFAULT_SIZE;
    var w = symbol.width || size;
    var h = symbol.height || size;
    if (imageData) {
      image = new Image();
      image.src = 'data:' + contentType + ';base64,' + imageData;
    }

    var pattern = ctx.createPattern(image, 'repeat');
    ctx.rect(0, 0, w, h);
    ctx.fillStyle = pattern;
    ctx.fill();

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        w - symbol.outline.width, h - symbol.outline.width);
      ctx.stroke();
    }
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
