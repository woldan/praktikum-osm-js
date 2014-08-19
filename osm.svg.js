/// Prepare namespaces to keep a clean structure:
var osm;
osm = osm || {};

// module to offer OSM XML SVG helpers:
osm.svg = function() {
  /// module variables:
  var data = undefined;
  var offset_x = undefined;
  var offset_y = undefined;
  var max_x = undefined;
  var max_y = undefined;
  var projection = undefined;
  var node_size = "0.3%";
  var view = undefined;
  var view_width = undefined;
  var view_height = undefined;
  var dispatch = d3.dispatch("loaded", "load_failed",
                             "node_hover_started", "node_hover_ended", "node_clicked",
                             "way_hover_started", "way_hover_ended", "way_clicked");

  /// module scopes:
  var internal = {};
  var exports = {};

  /// private functions:
  internal.init_transformation = function() {
    // .. determine OSM XML bounding box ..
    var bounds = data.bounds();
    var min_lat = bounds.attr("minlat");
    var min_lon = bounds.attr("minlon");
    var max_lat = bounds.attr("maxlat");
    var max_lon = bounds.attr("maxlon");

    // .. determine view size ..
    var view_width = d3.select("body svg").attr("width");
    var view_height  = d3.select("body svg").attr("height");

    projection = d3.geo.mercator()
                       .center(min_lon + ((max_lon - min_lon) / 2),
                               min_lat + ((max_lat - min_lat) / 2));

    // .. initialize transformation helpers ..
    var south_west = projection([min_lon, min_lat]);
    var north_east = projection([max_lon, max_lat]);
    offset_x = south_west[0];
    offset_y = south_west[1];
    max_x = view_height;
    max_y = view_width;
    scaling_x = view_width / (north_east[0] - south_west[0]);
    scaling_y = view_height / (north_east[1] - south_west[1]);
  };

  internal.project = function(node) {
    var result = undefined;
    if (node.hasOwnProperty("lat") && node.hasOwnProperty("lon")) {
      result = [ node.lon, node.lat ];
    } else if (node.nodeName == "tag") {
      result = [ d3.select(node.parentNode).attr("lon"),  d3.select(node.parentNode).attr("lat") ];
    } else {
      result = [ d3.select(node).attr("lon"), d3.select(node).attr("lat") ];
    }

    result = projection(result);
    return [ (result[0] - offset_x) * scaling_x,
             max_y - ((result[1] - offset_y) * scaling_y) ];
  };

  internal.way_points = function(_way) {
    var coordinates = [];
    var selectee = _way;
    if (_way.nodeName == "tag")
      selectee = _way.parentNode
    d3.select(selectee)
      .selectAll("nd")
        .each(function(d, i) {
          var node = data.node_by_reference(d3.select(this).attr("ref"));
          coordinates.push(""+internal.project(node)[0]+","+internal.project(node)[1]);
        })
    return coordinates;
  };

  /// private callback functions:
  internal.on_data_loaded = function() {
    internal.init_transformation();
    dispatch.loaded();
  };

  /// Setter for the OSM XML source.
  exports.load = function(_osm_xml) {
    data = osm.data()
              .source(_osm_xml)
              .on("loaded", internal.on_data_loaded)
              .on("load_failed", dispatch.load_failed)
              .load();
  };

  exports.view = function(_view_selector) {
    if (!arguments.length) {
      return view;
    } else {
      view = d3.select(_view_selector);
      return this;
    }
  };

  exports.node_size = function(_node_size) {
    if (!arguments.length) {
      return node_size;
    } else {
      node_size = d3.select(_node_size);
      return this;
    }
  };

  exports.draw_nodes = function(group, selector) {
    d3.select("body svg #features")
        .append("g")
          .attr("id", group)
      .selectAll("circle")
        .data(data.nodes(selector))
        .enter()
          .append("circle")
            .classed(group, true)
            .attr("cx", function(d) { return internal.project(d)[0]; })
            .attr("cy", function(d) { return internal.project(d)[1]; })
            .attr("r", node_size)
            .attr("stroke", function (d) {
                                var fill = d3.select(this).style("fill");
                                if (fill)
                                  return d3.rgb(fill).darker();
                                return "black";
                              })
            .on('mousein', dispatch.node_hover_started)
            .on('mouseout', dispatch.node_hover_ended)
            .on('click', dispatch.node_clicked);
    return this;
  };

  exports.draw_ways = function(group, selector) {
    d3.select("body svg #features")
      .append("g")
        .attr("id", group)
        .selectAll("polyline")
           .data(data.ways(selector))
           .enter()
             .append("polyline")
               .classed(group, true)
               .attr("points", function(d, i) {
                 return internal.way_points(d).join(" ");
               })
               .on('mousein', dispatch.way_hover_started)
               .on('mouseout', dispatch.way_hover_ended)
               .on('click', dispatch.way_clicked);
    return this;
  };

  d3.rebind(exports, dispatch, 'on');
  return exports;
};

