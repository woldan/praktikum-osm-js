/// Prepare namespaces to keep a clean structure:
var osm;
osm = osm || {};

// module to offer OSM XML SVG helpers:
osm.ui = function() {
  /// module variables:
  var data = undefined;
  var feature_tags = [];
  var dispatch = d3.dispatch();

  /// module scopes:
  var internal = {};
  var exports = {};

  /// private functions:
  internal.tags = function(data) {
    var selectee = data;
    if (selectee.nodeName == "tag")
      selectee = selectee.parentNode;
    if (!selectee)
      return;
    var result = [];
    var node = d3.select(selectee);
    var tags = node.selectAll("tag");
    tags.each(function(d, i) {
                result.push({ k: this.attributes['k'], v: this.attributes['v'] });
              });
    return result;
  }

  internal.info_window = function() {
    var svg_root = d3.select("body svg");
    var info_window = svg_root.select("#ui #info_window");
    if (info_window.empty()) {
      var window_x = svg_root.attr("x");
      var window_y = svg_root.attr("y");
      var window_width = svg_root.attr("width");
      var window_height = svg_root.attr("height") * 0.33;
      var button_height = 20;

      info_window = svg_root
                      .select("#ui")
                      .append("g")
                      .attr("id", "info_window")
      info_window.append("rect")
                    .classed("ui overlay", true)
                    .attr("id", "info_background")
                    .attr("x", window_x)
                    .attr("y", window_y)
                    .attr("width", window_width)
                    .attr("height", 0);
      info_window.append("rect")
                    .classed("ui overlay control", true)
                    .attr("id", "info_window_toggle_button")
                    .attr("x", window_x)
                    .attr("y", window_y)
                    .attr("width", window_width)
                    .attr("height", button_height)
                    .on("mouseover", internal.hover_init_handler)
                    .on("mouseout", internal.hover_finish_handler)
                    .on("click", function(d) {
                                  var info_background = d3.select("#info_background");
                                  if (!info_background.empty() && info_background.attr("height") <= 0) {
                                    internal.show_info_window();
                                  } else {
                                    internal.hide_info_window();
                                  }
                                });
    }
    return info_window;
  }

  internal.setup_info_window = function(data) {
    var info_window = internal.info_window();
    if (!info_window.empty()) {
      feature_tags = internal.tags(data);
      info_window.selectAll(".display").remove();
      info_window.selectAll(".display")
                  .data(feature_tags)
                  .enter()
                    .append("text")
                      .classed("ui overlay display", true)
                      .attr("x", 6)
                      .attr("y", function(d, i) {
                                    return 6 + ((i + 1) * 15);
                                  })
                      .text(function(d, i) {
                              return "" + d.k.value + ": " + d.v.value;
                            });
    }
  }

  internal.show_info_window = function () {
    var info_window = internal.info_window();
    if (!info_window.empty()) {
      var list_size = (feature_tags.length + 1) * 15 + 6;
      d3.select("#info_background")
        .transition()
          .duration(250)
          .attr("height", list_size);
      d3.select("#info_window_toggle_button")
        .transition()
          .duration(250)
          .attr("y", list_size);
      d3.selectAll("#ui .display")
        .transition()
          .delay(250)
          .duration(50)
          .attr("visibility", "visible");
    }
  }

  internal.hide_info_window = function () {
    var info_window = internal.info_window();
    if (!info_window.empty()) {
      d3.select("#info_background")
        .transition()
          .duration(250)
          .attr("height", 0);
      d3.select("#info_window_toggle_button")
        .transition()
          .duration(250)
          .attr("y", 0);
      d3.selectAll("#ui .display")
        .transition()
          .delay(0)
          .duration(50)
          .attr("visibility", "hidden");
    }
  }

  exports.hover_started_handler = function(d) {
    d3.select(this)
      .classed("hovered", true);
  };

  exports.hover_ended_handler = function(d) {
    d3.select(this)
      .classed("hovered", false);
  };

  exports.clicked_feature_handler = function(d) {
    d3.selectAll(".selected")
        .classed("selected", false);
    d3.select(this)
        .classed("selected", true);
    internal.setup_info_window(d);
    internal.show_info_window();
  };

  d3.rebind(exports, dispatch, 'on');
  return exports;
};

