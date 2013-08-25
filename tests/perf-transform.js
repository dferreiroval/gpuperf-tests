/*jslint anon:true, browser:true, sloppy:true, nomen:true, plusplus:true, devel: true, vars: true, white: true */
(function () {

    var DEFAULT_BODY_STYLES = 'html, body {margin: 0; padding: 0;} \n',
        DEFAULT_RUNS = 5,
        DEFAULT_LAYERS = 5,
        DEFAULT_TRANSITION_TIME = 100,
        DEFAULT_SIZE  = 250,
        DEFAULT_CONTAINER_STYLES = '#p {background:red; position: absolute;\n {prefix}transition: all linear {time}ms;\n {prefix}transform: translate3d(0,0,0);}',
        DEFAULT_STYLES = 'width: {size}px; height:{size}px; ',
        DEFAULT_LAYER_MARGIN = 'margin: 10px; display: inline-block;',
        DEFAULT_LAYER_STYLES = 'background: green;',
        TIME = window.performance || Date;

    function bind(ctx, fnc) {
        return function () { fnc.apply(ctx, arguments); };
    }

    var Perf = {

        _start: 0,
        _times: [],

        init: function () {
            this._setVendor();
        },
        _setVendor: function () {
            var styles = window.getComputedStyle(document.documentElement, ''),
                pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

            this.prefix = pre;
            this.eventEnd = pre + 'TransitionEnd';
            this.transform = pre + 'Transform';

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = window[pre + 'RequestAnimationFrame'];
            }

        },
        setup: function (config) {
            config || (config = {});

            this.debug = config.debug || false;
            this.runs = config.runs || DEFAULT_RUNS;
            this.styles = config.styles ||  '';
            this.time = config.time || DEFAULT_TRANSITION_TIME;
            this.size = config.size || DEFAULT_SIZE;
            this.layers = config.layers || DEFAULT_LAYERS;
            this.layerStyles = config.layerStyle || DEFAULT_LAYER_STYLES;
            this.callback = config.callback || function () {};

            this._stylesDOM = this._setStyles();
            this.container = this._createStage();
            this._transitionEvent =  bind(this, this._endTransform);

            if (this.debug) {
                console.log('Config:\n', JSON.stringify({
                    frames: this.frames,
                    size: this.size,
                    transitionTime: this.time,
                    layers: this.layers,
                    layersStyle: this.layersStyle
                 },null, '\t'));
            }

        },
        clean: function () {
            document.body.removeChild(this.container);
            document.head.removeChild(this._stylesDOM);
            this._stylesDOM = null;
            this.container = null;
            this._transitionEvent = null;
        },
        run: function () {
            this._runsLeft = this.runs;
            this._loop();
        },
        end: function (measures) {
            this.callback.call(null, measures);
        },
        /* private */
        _setStyles: function () {
            var styleDOM = document.createElement('style'),
                styles = DEFAULT_BODY_STYLES + DEFAULT_CONTAINER_STYLES,
                prefix = this.prefix ? '-' + this.prefix + '-' : '';

            styles = (styles.replace(/\{prefix\}/g, prefix)).replace('{time}', this.time);
            styleDOM.type = 'text/css';
            styleDOM.id = '_s';

            styleDOM.innerHTML = styles;
            document.head.appendChild(styleDOM);
            return styleDOM;
        },
        _createStage: function (styles) {
            var div = document.createElement('div');
            div.style.cssText = DEFAULT_STYLES.replace(/\{size\}/g, this.size) +  this.styles;
            div.id = 'p';

            this._createLayers(div);
            document.body.appendChild(div);
            return div;
        },
        _createLayers: function (container) {
            var relativeSize = Math.max((Math.floor(this.size / this.layers) - 15), 5) + 'px', //hardcoded margin
                i, div;

            for (i = 0; i < this.layers; i++) {
                div = document.createElement('div');
                div.style.cssText = DEFAULT_LAYER_MARGIN + this.layerStyles + ';width: ' + relativeSize + ';height: ' + relativeSize;
                container.appendChild(div);
            }
        },
        _loop: function () {
            this.container.style.display = 'block';
            this.container.offsetWidth; //force paint!
            window.requestAnimationFrame(bind(this, this._startTransform));
        },
        _startTransform: function (e) {
            var div = this.container;

            div.addEventListener(this.eventEnd, this._transitionEvent, false);
            div.style[this.transform] = 'translate3d(0, ' + this.size + 'px ,0)';

            this._start = TIME.now();
        },
        _endTransform: function (e) {
            var endTimeStamp = TIME.now() - this._start - this.time,
                div = this.container;

            div.removeEventListener(this.eventEnd, this._transitionEvent, false);

            div.style.display = 'none';
            div.style[this.transform] = '';
            this.container.offsetWidth; //force paint!

            this._end(endTimeStamp);
        },
        _end: function (timeStamp) {
            var times;
            this._times.push(timeStamp);

            if (--this._runsLeft) {
                this._loop();
            } else {
                times = this._times.slice(0);
                this._times = [];
                this.end(times);
            }
        }
    };

    Perf.init();

    if (typeof PERFSUITE === 'object' && PERFSUITE.tests) {
        PERFSUITE.tests.transform = Perf;
    } else {
        window.PerfTransform = Perf;
    }

}());