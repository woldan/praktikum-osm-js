/// Prepare namespaces to keep a clean structure:
var osm;
osm = osm || {};

// module to offer OSM XML data helpers:
osm.data = function() {
  /// module variables:
  var data = undefined;
  var node_cache = {};
  var enable_node_cache = true;
  var osm_xml_source = undefined;
  var dispatch = d3.dispatch("loaded", "load_failed");

  /// module scopes:
  var internal = {};
  var exports = {};

  /// private functions:
  internal.select = function(selector) {
    if (!data) {
      return undefined;
    }
    return d3.select(data)
             .selectAll(selector)[0];
  }

  internal.recreate_node_cache = function() {
    d3.select(data)
      .selectAll("node")
        .each(function(d,i) {
                var node = d3.select(this);
                node_cache[node.attr("id")] = {
                                                lat: node.attr("lat"),
                                                lon: node.attr("lon")
                                              };
              });
  }

  /// private callback functions:
  internal.on_document_loaded = function(_error, _data) {
    if (_error) {
      dispatch.load_failed();
    } else {
      data = _data;
      if (enable_node_cache) {
        internal.recreate_node_cache();
      }
      dispatch.loaded();
    }
  }

  /// Getter/setter for the OSM XML source.
  exports.source = function(_osm_xml_source) {
    if (!arguments.length) {
      return osm_xml_source;
    } else {
      osm_xml_source = _osm_xml_source;
      return this;
    }
  };

  /// Getter/setter for the node caching option.
  exports.caching = function(_enable) {
    if (!arguments.length) {
      return enable_node_cache;
    } else {
      enable_node_cache = _enable;
      return this;
    }
  };

  /// Loads the set document.
  exports.load = function() {
    d3.xml(osm_xml_source,
           "application/xml",
           internal.on_document_loaded);
    return this;
  }

  /// Getter for specific nodes in the OSM XML data.
  exports.nodes = function(selector) {
    return internal.select("osm node " + selector);
  }

  /// Getter for specific ways in the OSM XML data.
  exports.ways = function(selector) {
    return internal.select("osm way " + selector);
  }

  d3.rebind(exports, dispatch, 'on');
  return exports;
};

