// Exact approved 2026-11-24 artwork. Coordinates measured against the visible plaques.
export const responsiveWorldMaps = {
  "pc": {
    "key": "pc",
    "filename": "world-map-pc-20261124.png",
    "width": 1672,
    "height": 941,
    "bytes": 3127684,
    "sha256": "ca94289b5fbc0474be31e181c1ecf8daf54e313de8418f0b6c11b6ff1f44fef7",
    "chunks": 7,
    "hotspots": [
      {
        "x": 0.1425,
        "y": 0.294815,
        "width": 0.138333,
        "height": 0.054815
      },
      {
        "x": 0.33,
        "y": 0.296296,
        "width": 0.126667,
        "height": 0.054815
      },
      {
        "x": 0.509167,
        "y": 0.296296,
        "width": 0.126667,
        "height": 0.054815
      },
      {
        "x": 0.696667,
        "y": 0.296296,
        "width": 0.1225,
        "height": 0.054815
      },
      {
        "x": 0.873333,
        "y": 0.296296,
        "width": 0.114167,
        "height": 0.054815
      },
      {
        "x": 0.865,
        "y": 0.422222,
        "width": 0.116667,
        "height": 0.054815
      },
      {
        "x": 0.658333,
        "y": 0.456296,
        "width": 0.113333,
        "height": 0.054815
      },
      {
        "x": 0.869167,
        "y": 0.561481,
        "width": 0.1275,
        "height": 0.054815
      },
      {
        "x": 0.645,
        "y": 0.595556,
        "width": 0.116667,
        "height": 0.054815
      },
      {
        "x": 0.460833,
        "y": 0.565926,
        "width": 0.121667,
        "height": 0.054815
      },
      {
        "x": 0.368333,
        "y": 0.447407,
        "width": 0.1225,
        "height": 0.054815
      },
      {
        "x": 0.155833,
        "y": 0.453333,
        "width": 0.1325,
        "height": 0.054815
      },
      {
        "x": 0.250833,
        "y": 0.6,
        "width": 0.144167,
        "height": 0.054815
      },
      {
        "x": 0.380833,
        "y": 0.746667,
        "width": 0.140833,
        "height": 0.054815
      },
      {
        "x": 0.5775,
        "y": 0.771852,
        "width": 0.133333,
        "height": 0.054815
      },
      {
        "x": 0.829167,
        "y": 0.76,
        "width": 0.1375,
        "height": 0.054815
      }
    ]
  },
  "mobile": {
    "key": "mobile",
    "filename": "world-map-mobile-20261124.png",
    "width": 882,
    "height": 1780,
    "bytes": 2755048,
    "sha256": "f57bb95b02e1931932c0ad9fcca16ec929854c8a326d69385e12b041e277e472",
    "chunks": 6,
    "hotspots": [
      {
        "x": 0.269725,
        "y": 0.25,
        "width": 0.354128,
        "height": 0.042727
      },
      {
        "x": 0.746789,
        "y": 0.250909,
        "width": 0.346789,
        "height": 0.042727
      },
      {
        "x": 0.286239,
        "y": 0.35,
        "width": 0.322936,
        "height": 0.042727
      },
      {
        "x": 0.755963,
        "y": 0.35,
        "width": 0.33945,
        "height": 0.042727
      },
      {
        "x": 0.286239,
        "y": 0.440909,
        "width": 0.321101,
        "height": 0.042727
      },
      {
        "x": 0.774312,
        "y": 0.441818,
        "width": 0.33578,
        "height": 0.042727
      },
      {
        "x": 0.317431,
        "y": 0.530909,
        "width": 0.306422,
        "height": 0.042727
      },
      {
        "x": 0.783486,
        "y": 0.531818,
        "width": 0.322936,
        "height": 0.042727
      },
      {
        "x": 0.772477,
        "y": 0.619091,
        "width": 0.280734,
        "height": 0.042727
      },
      {
        "x": 0.779817,
        "y": 0.7,
        "width": 0.350459,
        "height": 0.042727
      },
      {
        "x": 0.319266,
        "y": 0.619091,
        "width": 0.344954,
        "height": 0.042727
      },
      {
        "x": 0.310092,
        "y": 0.7,
        "width": 0.366972,
        "height": 0.042727
      },
      {
        "x": 0.33945,
        "y": 0.787273,
        "width": 0.33945,
        "height": 0.042727
      },
      {
        "x": 0.783486,
        "y": 0.788182,
        "width": 0.346789,
        "height": 0.042727
      },
      {
        "x": 0.493578,
        "y": 0.884545,
        "width": 0.310092,
        "height": 0.042727
      },
      {
        "x": 0.820183,
        "y": 0.887273,
        "width": 0.313761,
        "height": 0.042727
      }
    ]
  }
} as const;
export function responsiveWorldMapForWidth(width: number) {
  return width < 700 ? responsiveWorldMaps.mobile : responsiveWorldMaps.pc;
}
export function responsiveWorldMapImageUrl(map: typeof responsiveWorldMaps.pc | typeof responsiveWorldMaps.mobile) {
  return '/kazu-no-tobira/'+map.filename+'?v='+map.sha256.slice(0,8);
}

// Grade/course labels follow the unchanged canonical worldIslands order.
export const responsiveWorldMapGradeLabels = ["幼児","小1","小2","小3","小4","小5","小6","中1","中2","中3","高1","高2","高3","理系大学入試","最難関・数学競技","大学数学・探究"] as const;
