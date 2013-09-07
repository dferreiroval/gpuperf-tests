/*jslint anon:true, browser:true, sloppy:true, nomen:true, plusplus:true, devel: true, vars: true, white: true */
/*global PERF_TEST_CONFIG, LazyLoad */

var PERFSUITE = (function () {
    "use strict";

    // HELPER METHODS
    function bind(ctx, fnc) {
        var xargs = arguments.length > 2 ? Array.prototype.slice.call(arguments).slice(2) : null;

        return function() {
            var args = xargs ? xargs.concat(Array.prototype.slice.call(arguments)) : arguments;
            return fnc.apply(ctx, args);
        };
    }

    function createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();

        if ("withCredentials" in xhr) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof window.XDomainRequest !== "undefined") {
            // XDomainRequest for IE.
            xhr = new window.XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    }

    function median(values) {
        var half = Math.floor(values.length / 2),
            result;

        values.sort(function (a, b) {return a - b; });

        if (values.length % 2) {
            result = values[half];
        } else {
            result = (values[half - 1] + values[half]) / 2.0;
        }
        return result;
    }

    function average (values) {
        var size = values.length,
            sum = 0,
            i;

        for (i = 0; i < size; i++) {
            sum += values[i];
        }

        return sum / size;
    }

    var DEFAULT_TESTS = [
            'canvas',
            'composite',
            'transform'
        ],

        DEFAULT_WAIT_TIME = 1000,

        DEFAULT_SERVER = 'http://localhost:5000/sendResults',

        DEFAULT_CONFIG = {
            canvas: [
                {
                    description: 'DefaultCanvas'
                },
                {
                    description: 'DefaultCanvas'
                }
            ],
            composite: {
                description: 'DefaultComposite'
            },
            transform: {
                description: 'DefaultTransform'
            }
        },

        SUITE = {
            server: DEFAULT_SERVER,
            testList: [],
            config: {},
            tests: {},
            results: {
                tests: []
            },

            initialize: function () {
                this.setEnvironment();
                this.loadTests(); //this will call run when all the tests are ready
                this._testQueue = [];
            },
            setEnvironment: function () {
                var env = this._getParams();
                this.testList = env.tests || DEFAULT_TESTS;
                this.config = env.config || PERF_TEST_CONFIG || DEFAULT_CONFIG;
                this.debug = env.debug || false;
                this.server = env.server || DEFAULT_SERVER;
            },
            _getParams: function () {
                var env = window.GPU_PERF_ENV || {},
                    params = window.location.search || window.location.hash,
                    paramsList = params.slice(1).split("&"),
                    param,
                    i;

                for (i = 0; i < paramsList.length; i++) {
                    param = paramsList[i].split('=');

                    env[param[0]] = param[1];
                }

                if (env.tests) {
                    env.tests = env.tests.split(',');
                }

                if (env.config) {
                    try {
                        env.config = JSON.parse(env.config);
                    } catch (e) {
                        env.config = {};
                    }
                }

                return env;
            },
            loadTests: function () {
                var tests = this.testList,
                    path = this.config.testPath || '/tests',
                    urls = [],
                    i;

                for (i = 0; i < tests.length; i++) {
                    urls.push(path + '/perf-' + tests[i] + '.js?t=' + Date.now()); // add timestamp so the browser don't caches the tests
                }

                LazyLoad.js(urls, this.onTestsLoaded, tests, this);
            },
            onTestsLoaded: function (tests) {
                var i;
                for (i = 0; i < tests.length; i++) {
                    if (!this.tests[tests[i]]) {
                        console.log('Error: Test [' + tests[i] + '] not loaded.');
                        //TODO remove tests from list...
                    }
                }
                //START THE TESTS!
                this.run();
            },
            run: function () {
                var tests = this.testList,
                    config = this.config,
                    testName,
                    testConfig,
                    testObject,
                    i;

                for (i = 0; i < tests.length; i++) {
                    testName = tests[i];
                    testConfig = config[testName];
                    testObject = this.tests[testName];
                    if (testObject) {
                        if (testConfig) {
                            this._queueTest(testName, testObject, config[testName]);
                        } else {
                            this._queueTest(testName, testObject, {name: 'DefaultTest'});
                        }
                    } 
                }

                this.runTests();
            },
            _queueTest: function (name, test, config) {
                if (config instanceof Array) {
                    for (var i = 0; i < config.length; i++) {
                        this._queueTest(name, test, config[i]);
                    }
                } else {
                    this._testQueue.push({name: name, test: test, config: config});
                }
            },
            _unqueueTest: function () {
                return this._testQueue.shift();
            },

            runTests: function () {
                var test = this._unqueueTest();
                if (test) {
                    this.startTest(test.name, test.test, test.config);
                } else {
                    this._finishTests();
                }
            },
            _finishTests: function () {
                var results = this.results;
                results.time = Date.now();

                if (this.debug) {
                    console.log(results);
                }

                this._sendResults(results);
            },
            _sendResults: function (results) {
                var xhr = createCORSRequest('POST', this.server);
                xhr.setRequestHeader('Content-type', 'application/json');
                xhr.onload = function () {
                    console.log(JSON.parse(xhr.responseText));
                };

                xhr.send(JSON.stringify(results));
            },
            startTest: function (name, test, config, callback) {
                config.debug = this.debug;
                config.callback = callback || bind(this, this.endTest, name, test, config);

                if (this.debug) {
                    console.log('Running Test: ' + name + ' | ID: ' + config.description);
                }

                test.init();
                test.setup(config);
                test.run();
            },
            endTest: function (testName, testInstance, config, measures) {
                var results = this.results.tests;

                delete config.debug;
                delete  config.callback;
                
                results.push({
                    name: testName,
                    description: config.description || '',
                    config: config,
                    results: measures,
                    average: average(measures),
                    median: median(measures)
                });

                testInstance.clean();
                setTimeout(bind(this, this.runTests), DEFAULT_WAIT_TIME);

                if (this.debug) {
                    console.log('Results: ', JSON.stringify({
                        results: measures,
                        average: average(measures),
                        median: median(measures)     
                    }, null, '\t'), '\n\n\n ============ TEST DONE ============\n\n\n');
                }
            }
        };

    window.addEventListener('load', function () {
        SUITE.initialize();
    });

    return SUITE;

}());