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

  // .. initialize transformation helpers ..
  osm.current.offset_x = min_lon;
  osm.current.offset_y = min_lat;
  osm.current.max_x = view_height;
  osm.current.max_y = view_width;
  osm.current.scaling_x = view_width / (max_lon - min_lon);
  osm.current.scaling_y = view_height / (max_lat - min_lat);
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
          .attr("cx", osm.feature.longitude)
          .attr("cy", osm.feature.latitude)
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

osm.feature.latitude = function (node) {
  var result = 0;
  if (node.nodeName == "tag") {
    result = d3.select(node.parentNode).attr("lat");
  } else {
    result = d3.select(node).attr("lat");
  }
  return osm.current.max_y - ((result - osm.current.offset_y) * osm.current.scaling_y);
}

osm.feature.longitude = function (node) {
  var result = 0;
  if (node.nodeName == "tag") {
    result = d3.select(node.parentNode).attr("lon");
  } else {
    result = d3.select(node).attr("lon");
  }
  return (result - osm.current.offset_x) * osm.current.scaling_x;
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
        var id = d3.select(this).attr("ref");
        var node = d3.select(data)
                     .selectAll("[cssid=nd_"+id+"]")[0][0];
        coordinates.push(""+osm.feature.longitude(node)+","+osm.feature.latitude(node));
      })
  return coordinates;
};

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
  osm.feature.add_css_compliant_ids(data);
  osm.feature.init_transformation(data, "#renderArea");

  osm.svg.circles("bus_stops",
                  data,
                  "osm node tag[k=highway][v=bus_stop]",
                  { radius: 3, fill: "red" });
  osm.svg.circles("shops",
                  data,
                  "osm node tag[k=shop]",
                  { radius: 3, fill: "brown" });
  osm.svg.circles("leisure",
                  data,
                  "osm node tag[k=leisure]",
                  { radius: 3, fill: "green" });
  osm.svg.circles("power",
                  data,
                  "osm node tag[k=power]",
                  { radius: 2, fill: "#839496" });
  osm.svg.circles("recycling",
                  data,
                  "osm node tag[v=recycling]",
                  { radius: 2, fill: "#859900" });

  osm.svg.polylines("buildings",
                    data,
                    "osm way tag[k=building][v=yes]",
                    { fill: "#eee8d5" });
  osm.svg.polylines("streets",
                    data,
                    "osm way tag[k=highway][v=residential],[v=secondary],[v=secondary],[v=tertiary]",
                    { stroke: "grey", stroke_width: 2 });

  osm.svg.polylines("ways",
                    data,
                    "osm way tag[k=highway][v=cycleway],[v=footway],[v=track],[v=path],[v=service]",
                    { stroke: "#b58900", stroke_width: 0.5 });

  var ways = d3.select(osm.current.data).selectAll("osm way[visible=true]")
  var my_way = ways[0][0]
  var coordinates = osm.feature.way_points(data, my_way);
}
