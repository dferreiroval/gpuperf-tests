/*jslint anon:true, browser:true, sloppy:true, nomen:true, plusplus:true, devel: true, vars: true, white: true */
/*
* Canvas test
*/

(function () {

    var DEFAULT_STYLES = 'html, body {margin: 0; padding: 0;} \n',

        DEFAULT_OPACITY  = 0.5,
        DEFAULT_RUNS = 5,
        DEFAULT_SIZE = 50,

        TIME = window.performance || Date;

    function bind(ctx, fnc) {
        return function () { fnc.apply(ctx, arguments); };
    }

    var PerfTest = {

        _start: 0,
        _runsLeft: 0,
        _times: [],

        init: function () {
            this._setVendor();
        },
        _setVendor: function () {
            var styles = window.getComputedStyle(document.documentElement, ''),
                pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

            this.prefix = pre;

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = window[pre + 'RequestAnimationFrame'];
            }
        },
        setup: function (config) {
            config || (config = {});

            //properties
            this.debug = config.debug || false;
            this.width = config.width || DEFAULT_SIZE;
            this.height = config.height || DEFAULT_SIZE;
            this.runs = config.runs || DEFAULT_RUNS;
            this.opacity = config.opacity || DEFAULT_OPACITY;
            this.callback = config.callback || function () {};

            if (this.debug) {
                console.log('Config:\n', JSON.stringify({
                    width: this.width,
                    height: this.height,
                    runs: this.runs,
                    opacity: this.opacity
                },null, '\t'));
            }
            //init functions

            this.canvasDOM = this._createCanvas();
            this.texture = this._generateNoiseTexture(this.canvas);
        },
        clean: function () {
            document.body.removeChild(this.canvasDOM);
        },

        run: function () {
            this._runsLeft = this.runs;
            this._loop();
        },
        end: function (measures) {
            this.callback.call(null, measures);
        },

        _createCanvas: function (){
            var canvas = document.createElement('canvas'),
                width = this.width,
                height = this.height;

            canvas.width = width;
            canvas.height = height;

            document.body.appendChild(canvas);

            return canvas;
        },
        _generateNoiseTexture: function (canvas) {
            var opacity = this.opacity,
                width = this.width,
                height = this.height,
                payload = [],
                aux, rgb, x, y;

            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    payload[x * width + y] = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
                }
            }

            return payload;

        },
        _getPaintedCanvasFromTexture: function (texture2d, canvas) {
            var canvas = canvas || document.createElement('canvas'),
                opacity = this.opacity,
                ctx = canvas.getContext('2d'),
                width = this.width,
                height = this.height,
                texture = texture2d || this.texture,
                x,
                y,
                rgb;

            ctx.fillStyle = 'rgb(255,255,255)';
            ctx.fillRect(0,0,canvas.width, canvas.height);

            for (x = 0; x < width; x++) {
                for (y = 0; y < height; y++) {
                    rgb = texture[x * width + y];
                    ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + opacity + ")";
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            return canvas;
        },

        _loop: function () {
            this._loopID = window.requestAnimationFrame(bind(this, this._startDraw));
        },

        _startDraw: function (t) {
            this._start = t;

            this._getPaintedCanvasFromTexture(this.texture, this.canvasDOM);
            window.requestAnimationFrame(bind(this, this._measureDraw));
        },

        _measureDraw: function (timeStamp) {
            var delta = timeStamp - this._start,
                times;
            this._times.push(delta);

            if (--this._runsLeft) {
                window.requestAnimationFrame(bind(this, this._loop));
            } else {
                times = this._times.slice(0);
                this._times = [];
                this.end(times);
            }
        }
    };

    PerfTest.init();

    if (typeof PERFSUITE === 'object' && PERFSUITE.tests) {
        PERFSUITE.tests.canvas = PerfTest;
    } else {
        window.PerfCanvas = PerfTest;
    }

}());