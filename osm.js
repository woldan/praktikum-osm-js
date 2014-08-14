/// Prepare namespaces to keep a clean structure:
var osm = {};
// namespace to offer SVG helpers:
osm.svg = {};
// namespace to offer OSM XML feature helpers:
osm.feature = {};
// namespace to hold current state:
osm.current = {}
osm.current.data = undefined;

/// Sets the SVG 'viewBox' attribute to data's OSM XML bounds.
osm.svg.view_box = function(data) {
  var bounds = d3.select(data)
                 .selectAll("osm bounds");
  var min_lat = bounds.attr("minlat");
  var min_lon = bounds.attr("minlon");
  var max_lat = bounds.attr("maxlat");
  var max_lon = bounds.attr("maxlon");
  d3.select("body")
    .select("svg")
      .attr("viewBox", [min_lon, min_lat, (max_lon - min_lon), (max_lat - min_lat)].join())
};

osm.feature.init_transformation = function(data, view_selector) {
  // .. determine OSM XML bounding box ..
  var bounds = d3.select(data)
                 .selectAll("osm bounds");
  var min_lat = bounds.attr("minlat");
  var min_lon = bounds.attr("minlon");
  var max_lat = bounds.attr("maxlat");
  var max_lon = bounds.attr("maxlon");

  // .. determine view size ..
  var view_width = d3.select(view_selector).attr("width");
  var view_height  = d3.select(view_selector).attr("height");

  osm.current.projection = d3.geo.mercator().center(min_lon + ((max_lon - min_lon) / 2),
                                                    min_lat + ((max_lat - min_lat) / 2));

  // .. initialize transformation helpers ..
  var south_west = osm.current.projection([min_lon, min_lat]);
  var north_east = osm.current.projection([max_lon, max_lat]);
  osm.current.offset_x = south_west[0];
  osm.current.offset_y = south_west[1];
  osm.current.max_x = view_height;
  osm.current.max_y = view_width;
  osm.current.scaling_x = view_width / (north_east[0] - south_west[0]);
  osm.current.scaling_y = view_height / (north_east[1] - south_west[1]);
};

osm.svg.circles = function (group, data, selector, style) {
  d3.select("body")
    .select("svg")
      .append("g")
        .attr("id", group)
    .selectAll("circle")
      .data(d3.select(data).selectAll(selector)[0])
      .enter()
        .append("circle")
          .attr("cx", function(d) { return osm.feature.project(d)[0]; })
          .attr("cy", function(d) { return osm.feature.project(d)[1]; })
          .attr("r", style.radius)
          .attr("fill", style.fill);
};

osm.svg.polylines = function (group, data, selector, style) {
  d3.select("body")
    .select("svg")
      .append("g")
        .attr("id", group)
        .selectAll("polyline")
          .data(d3.select(data).selectAll(selector)[0])
          .enter()
            .append("polyline")
              .attr("fill", style.fill || "none")
              .attr("stroke", style.stroke || "none")
              .attr("stroke-width", style.stroke_width || 1)
              .attr("points", function(d, i) {
                return osm.feature.way_points(data, d).join(" "); });
};

osm.feature.project = function (node) {
  var result = undefined;
  if (node.hasOwnProperty("lat") && node.hasOwnProperty("lon")) {
    result = [ node.lon, node.lat ];
  } else if (node.nodeName == "tag") {
    result = [ d3.select(node.parentNode).attr("lon"),  d3.select(node.parentNode).attr("lat") ];
  } else {
    result = [ d3.select(node).attr("lon"), d3.select(node).attr("lat") ];
  }

  result = osm.current.projection(result);
  return [ (result[0] - osm.current.offset_x) * osm.current.scaling_x,
           osm.current.max_y - ((result[1] - osm.current.offset_y) * osm.current.scaling_y) ];
};

osm.feature.longitude = function (node) {
  var result = 0;
  if (node.hasOwnProperty("lon")) {
    result = node.lon;
  } else if (node.nodeName == "tag") {
    result = d3.select(node.parentNode).attr("lon");
  } else {
    result = d3.select(node).attr("lon");
  }
  return (result - osm.current.offset_x) * osm.current.scaling_x;
};

osm.feature.latitude = function (node) {
  var result = 0;
  if (node.hasOwnProperty("lat")) {
    result = node.lat;
  } else if (node.nodeName == "tag") {
    result = d3.select(node.parentNode).attr("lat");
  } else {
    result = d3.select(node).attr("lat");
  }
  return osm.current.max_y - ((result - osm.current.offset_y) * osm.current.scaling_y);
};


osm.feature.ways = function (data, selector) {
  return d3.select(data)
           .selectAll(selector)[0];
};

osm.feature.way_points = function (data, way) {
  var coordinates = [];
  var selectee = way;
  if (way.nodeName == "tag")
    selectee = way.parentNode
  d3.select(selectee)
    .selectAll("nd")
      .each(function (d, i) {
        var node = osm.feature.node_by_ref(d3.select(this));
        coordinates.push(""+osm.feature.project(node)[0]+","+osm.feature.project(node)[1]);
      })
  return coordinates;
};

osm.feature.node_by_ref = function (referencing_node) {
  var id = referencing_node.attr("ref");
  return osm.current.node_cache[id];
}

osm.feature.cache_nodes = function (data) {
  osm.current.node_cache = {};
  d3.select(data)
    .selectAll("node")
      .each(function(d,i) {
              var node = d3.select(this);
              osm.current.node_cache[node.attr("id")] = {
                                                          lat: node.attr("lat"),
                                                          lon: node.attr("lon")
                                                        };
            });
}

osm.feature.add_css_compliant_ids = function (data) {
  d3.select(data)
    .selectAll("node")
      .each(function(d,i) {
              d3.select(this).attr("cssid", "nd_"+d3.select(this).attr("id"));
            });
}

osm.process = function(data) {
  "use strict";
  osm.current.data = data; //< just to allow for simple interactive tinkering!

  // workaround: OSM XML uses ids that do not conform to CSS identifiers:
  //osm.feature.add_css_compliant_ids(data);

  osm.feature.cache_nodes(data);
  osm.feature.init_transformation(data, "#renderArea");

  osm.svg.polylines("streets",
                    data,
                    "osm way tag[k=highway][v=residential],[v=secondary],[v=secondary],[v=tertiary]",
                    { stroke: "grey", stroke_width: "0.25%" });
  osm.svg.polylines("ways",
                    data,
                    "osm way tag[k=highway][v=cycleway],[v=track],[v=service]",
                    { stroke: "#b58900", stroke_width: "0.1%" });
  osm.svg.polylines("paths",
                    data,
                    "osm way tag[k=highway][v=footway],[v=path]",
                    { stroke: "#b58900", stroke_width: "0.033%" });

  osm.svg.polylines("buildings",
                    data,
                    "osm way tag[k=building][v=yes]",
                    { fill: "#eee8d5" });

  osm.svg.circles("bus_stops",
                  data,
                  "osm node tag[k=highway][v=bus_stop]",
                  { radius: "0.5%", fill: "red" });
  osm.svg.circles("shops",
                  data,
                  "osm node tag[k=shop]",
                  { radius: "0.5%", fill: "brown" });
  osm.svg.circles("leisure",
                  data,
                  "osm node tag[k=leisure]",
                  { radius: "0.5%", fill: "green" });
  osm.svg.circles("power",
                  data,
                  "osm node tag[k=power]",
                  { radius: "0.25%", fill: "#839496" });
  osm.svg.circles("recycling",
                  data,
                  "osm node tag[v=recycling]",
                  { radius: "0.25%", fill: "#859900" });

  var ways = d3.select(osm.current.data).selectAll("osm way[visible=true]")
  var my_way = ways[0][0]
  var coordinates = osm.feature.way_points(data, my_way);
}
