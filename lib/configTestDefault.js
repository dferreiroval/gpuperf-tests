var PERF_TEST_CONFIG = {
    "canvas": [
        {
            "description": "canvas:{size:50,opacity:0.5}",
            "runs": 10,
            "width": 50,
            "height": 50,
            "opacity": 0.5
        },
        {
            "description": "canvas:{size:50,opacity:1}",
            "runs": 10,
            "width": 50,
            "height": 50,
            "opacity": 1
        },
        {
            "description": "canvas:{size:100,opacity:0.5}",
            "runs": 10,
            "width": 100,
            "height": 100,
            "opacity": 0.5
        }
    ],
    "composite": [
        {
            "description": "composite:{layers:100,shadow:25px}",
            "runs": 10,
            "layers": 100,
            "frames": 1,
            "pattern": "%8$#@",
            "styles": "text-shadow: 0 0 25px red; position:absolute;"
        },
        {
            "description": "composite:{layers:100,shadow: 50px}",
            "runs": 10,
            "layers": 100,
            "frames": 1,
            "pattern": "%8$#@",
            "styles": "text-shadow: 0 0 50px red; position:absolute;"
        },
        {
            "description": "composite:{layers:200,shadow:25px}",
            "runs": 10,
            "layers": 200,
            "frames": 1,
            "pattern": "%8$#@",
            "styles": "text-shadow: 0 0 25px red; position:absolute;"
        },
        {
            "description": "composite:{layers:200,shadow:50px}",
            "runs": 10,
            "layers": 200,
            "frames": 1,
            "pattern": "%8$#@",
            "styles": "text-shadow: 0 0 50px red; position:absolute;"
        }
    ],
    "transform": [
        {
            "description": "transform:{layers:10,size:400px}",
            "runs": 10,
            "layers": 10,
            "size": 400,
            "styles": "background: #ddd",
            "layerStyle": "box-shadow: 1px 2px 3px #222;"
        },
        {
            "description": "transform:{layers:100,size:400px}",
            "runs": 10,
            "layers": 100,
            //"time": 100,
            "size": 400,
            "styles": "background:#ddd",
            "layerStyle": "box-shadow: 1px 2px 3px #222;"
        },
        {
            "description": "transform:{layers:200,size:400px}",
            "runs": 10,
            "layers": 200,
            //"time": 100,
            "size": 400,
            "styles": "background:#ddd",
            "layerStyle": "box-shadow: 1px 2px 3px #222;"
        }
    ]
};