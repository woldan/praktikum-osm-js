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
  if (node.nodeName == "tag") {
    return d3.select(node.parentNode).attr("lat");
  }
  return d3.select(node).attr("lat");
}

osm.feature.longitude = function (node) {
  if (node.nodeName == "tag") {
    return d3.select(node.parentNode).attr("lon");
  }
  return d3.select(node).attr("lon");
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
        coordinates.push(""+d3.select(node).attr("lon")+","+d3.select(node).attr("lat"));
      })
  return coordinates;
};

osm.process = function(data) {
  "use strict";
  osm.current.data = data; //< just to allow for simple interactive tinkering!

  // workaround: OSM XML uses ids that do not conform to CSS identifiers:
  d3.select(data)
    .selectAll("node")
      .each(function(d,i) {
        d3.select(this).attr("cssid", "nd_"+d3.select(this).attr("id"));
      });

  osm.svg.view_box(data);
  osm.svg.circles("nodes",
                  data,
                  "osm node",
                  { radius: 0.00001, fill: "black" });
  osm.svg.circles("bus_stops",
                  data,
                  "osm node tag[k=highway][v=bus_stop]",
                  { radius: 0.00005, fill: "red" });
  osm.svg.circles("shops",
                  data,
                  "osm node tag[k=shop]",
                  { radius: 0.00005, fill: "brown" });
  osm.svg.circles("leisure",
                  data,
                  "osm node tag[k=leisure]",
                  { radius: 0.00005, fill: "green" });
  osm.svg.circles("power",
                  data,
                  "osm node tag[k=power]",
                  { radius: 0.00005, fill: "#839496" });
  osm.svg.polylines("buildings",
                    data,
                    "osm way tag[k=building][v=yes]",
                    { fill: "#eee8d5" });
  osm.svg.polylines("streets",
                    data,
                    "osm way tag[k=highway][v=residential],[v=secondary],[v=secondary],[v=tertiary]",
                    { stroke: "grey", stroke_width: "0.1%" });

  osm.svg.polylines("ways",
                    data,
                    "osm way tag[k=highway][v=cycleway],[v=footway],[v=track],[v=path],[v=service]",
                    { stroke: "#b58900", stroke_width: "0.1%" });

  var ways = d3.select(osm.current.data).selectAll("osm way[visible=true]")
  var my_way = ways[0][0]
  var coordinates = osm.feature.way_points(data, my_way);
}
