/*jslint anon:true, browser:true, sloppy:true, nomen:true, plusplus:true, devel: true, vars: true, white: true */

(function () {

    var DEFAULT_CONTAINER_STYLE = 'position:absolute;top:120px;left:120px;margin:0;padding:0;',
        DEFAULT_PATTERN = '%8$#@',
        DEFAULT_PATTERN_ELMT = '<p class="p">{pattern}</p>',
        DEFAULT_PATTERN_STYLE = 'position:absolute; text-shadow: 0 0 10px black;',
        DEFAULT_LAYERS = 100,
        DEFAULT_RUNS = 5,
        DEFAULT_RECORDER_FRAMES = 5;

    function bind(ctx, fnc) {
        return function () { fnc.apply(ctx, arguments); };
    }

    var GPUPERF = {

        _start: 0,
        _runsLeft: 0,
        _framesLeft: 0,
        _runTimes: [],
        _times: [],

        init: function () {
            this._setVendor();
        },
        _setVendor: function () {
            var styles = window.getComputedStyle(document.documentElement, ''),
                pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = window[pre + 'RequestAnimationFrame'];
            }
        },
        setup: function (config) {
            config || (config = {});

            var pattern = config.pattern || DEFAULT_PATTERN,
                element = DEFAULT_PATTERN_ELMT.replace('{pattern}', pattern),
                patternStyle = config.styles || DEFAULT_PATTERN_STYLE,
                style = document.createElement('style');

            style.type = 'text/css';
            style.id = '_s';
            style.innerHTML = '#_perf.on .p {' + patternStyle + '}';
            document.head.appendChild(style);

            if (!this.target) {
                this.target = this._createStage(config.stageStyle);
            }

            this.pattern = element;
            this.runs = config.runs || DEFAULT_RUNS;
            this.frames = config.frames || DEFAULT_RECORDER_FRAMES;
            this.layers = config.layers || DEFAULT_LAYERS;
            this.debug = config.debug || false;
            this.callback = config.callback || function () {};

            if (this.debug) {
                console.log('Config:\n', JSON.stringify({
                    pattern: this.pattern,
                    frames: this.frames,
                    layers: this.layers,
                    runs: this.runs,
                    patternStyle: patternStyle
                 },null, '\t'));
            }
        },
        clean: function () {
            var element = this.target,
                style = document.getElementById('_s');

            document.body.removeChild(element);
            document.head.removeChild(style);
            this.target = null;
        },
        doPaint: function () {
            var p = this.target,
                text = '',
                i;

            for (i = 0; i < this.layers; i++) {
                text += this.pattern;
            }
            p.innerHTML = text;
            p.offsetWidth;//force the browser to paint
            p.className = 'on';
        },
        undoPaint: function () {
            var p = this.target;
            p.innerHTML = '';
            p.offsetWidth;
        },
        run: function () {
            this._runsLeft = this.runs;
            this._loop();
        },
        end: function (measures) {

            this.callback.call(null, measures);
        },
        /* private */
        _createStage: function (styles) {
            var div = document.createElement('div');
            div.style.cssText = styles || DEFAULT_CONTAINER_STYLE;
            div.id = '_perf';
            document.body.appendChild(div);
            return div;
        },
        _loop: function () {
            this._loopID = window.requestAnimationFrame(bind(this, this._startPaint));
        },
        _startPaint: function (time) {
            var self = this;
            this._start = time;
            this._framesLeft = this.frames;
            this.doPaint();
            window.requestAnimationFrame(bind(this, this._measurePaint));
        },
        /*
        * For each paint we are going to capture the first "n" ticks 
        * to make sure we got the paint (since we don't want to force the paint, some browsers paint later)
        */
        _measurePaint: function (time) {
            var delta = time - this._start;
            this._start = time;
            this._times.push(delta);
            if (--this._framesLeft) {
                window.requestAnimationFrame(bind(this, this._measurePaint));
            } else {
                this._endPaint();
            }
        },
        _endPaint: function () {
            var runTimes;

            if (this.debug && this._times.length > 1) {
                console.log('FrameTimes: ', this._times);
            }

            this._runTimes.push(this._times.sort(function (a, b) {return a - b;}).pop()); //take the max which is the one with the repaint
            this._times = [];
            this.undoPaint();

            if (--this._runsLeft) {
                this._loop();
            } else {
                runTimes = this._runTimes.slice(0);
                if (this.debug) {
                    console.log('Paint runtimes: ', runTimes);
                }

                this._runTimes = [];
                this.end(runTimes);
            }
        }
    };

    GPUPERF.init();

    if (typeof PERFSUITE === 'object' && PERFSUITE.tests) {
        PERFSUITE.tests.composite = GPUPERF;
    } else {
        window.PerfComposite = GPUPERF;
    }

    return GPUPERF;
}());