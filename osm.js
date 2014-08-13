/// Prepare namespaces to keep a clean structure:
var osm = {
  // namespace to offer SVG helpers:
  var svg = {};
  // namespace to offer OSM XML feature helpers:
  var feature = {};
  // namespace to hold current state:
  var current = {
    var data = undefined;
  };
};

/// Returns the OSM XML bounds as a textual viewport rect ('x y width height') suitable for the SVG 'viewBox' attribute.
osm.svg.view_box = function(data) {
  var bounds = d3.select(data)
                 .selectAll("osm bounds");
  var min_lat = bounds.attr("minlat");
  var min_lon = bounds.attr("minlon");
  var max_lat = bounds.attr("maxlat");
  var max_lon = bounds.attr("maxlon");
  return "" + min_lat + " "
            + min_lon + " "
            + (max_lat - min_lat) + " "
            + (max_lon - min_lon);
};

osm.svg.circles = function (d, selector, style) {
  d3.select("body")
    .select("svg")
    .selectAll("circle")
      .data(selector)
      .enter()
        .append("circle")
          .attr("cx", function(d) { return d.parentNode.attributes["lat"].value; })
          .attr("cy", function(d) { return d.parentNode.attributes["lon"].value; })
          .attr("r", style.radius)
          .attr("style", style.fill);
};

osm.process = function(data) {
  "use strict";
  osm.current.data = data; //< just to allow for simple interactive tinkering!

  var osm_root = d3.select(data).selectAll("osm");
  var bus_stops = osm_root.selectAll("node tag[k=highway][v=bus_stop]")[0];

  d3.select("body")
    .selectAll("svg")
      .attr("viewBox", function(d) { return osm.svg.view_box(data); })
    .selectAll("circle")
      .data(bus_stops)
      .enter()
        .append("circle")
          .attr("cx", function(d) { return d.parentNode.attributes["lat"].value; })
          .attr("cy", function(d) { return d.parentNode.attributes["lon"].value; })
          .attr("r", 0.00005)
          .attr("style", "fill:red;")
}
