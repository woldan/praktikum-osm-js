describe("OSM XML accessor API osm.data", function() {

  describe("A vanilla OSM XML accessor API", function() {
    var testee;

    beforeEach(function() {
      testee = osm.data();
    });

    afterEach(function() {
      testee = undefined;
    });

    it("has no source defined", function() {
      expect(testee.source()).toBe(undefined);
    });

    it("yields an empty d3 selection for any selector on nodes", function() {
      expect(d3.select(testee.nodes("")).empty()).toBe(true);
      expect(d3.select(testee.nodes("tag")).empty()).toBe(true);
      expect(d3.select(testee.nodes("tag [k=highway]")).empty()).toBe(true);
    });

    it("yields an empty d3 selection for any selector on ways", function() {
      expect(d3.select(testee.ways("")).empty()).toBe(true);
      expect(d3.select(testee.ways("tag")).empty()).toBe(true);
      expect(d3.select(testee.ways("tag [k=highway]")).empty()).toBe(true);
    });

    describe("when setting source to foo.osm", function() {
      beforeEach(function() {
        testee.source('foo.osm');
      });

      it("has source foo.osm defined after setting source to foo.osm", function() {
        expect(testee.source()).toBe('foo.osm');
      });
    });

    describe("when registering a callback on loaded and calling load", function() {
      var loaded_spy = undefined;
      var load_failed_spy = undefined;

      beforeEach(function(done) {
        loaded_spy = jasmine.createSpy("on_loaded");
        load_failed_spy = jasmine.createSpy("on_loaded");
        testee.on("loaded", function() {
                              loaded_spy();
                              done();
                            })
              .on("load_failed", function() {
                                   load_failed_spy();
                                   done();
                                 })
              .load();
      });

      it("will not trigger the loaded callback upon load", function(done) {
        expect(loaded_spy).not.toHaveBeenCalled();
        done();
      });

      it("will trigger the load failed callback upon load", function(done) {
        expect(load_failed_spy).toHaveBeenCalled();
        done();
      });
    });

  });

  describe("A OSM XML accessor API set up with data from Martinsried", function() {
    var testee;

    beforeEach(function() {
      testee = osm.data()
                  .source('martinsried.osm');
    });

    afterEach(function() {
      testee = undefined;
    });

    it("has a source defined", function() {
      expect(testee.source()).not.toBe(undefined);
      expect(testee.source()).not.toBeNull();
    });

    describe("when registering a callback on loaded and calling load", function() {
      var loaded_spy = undefined;
      var load_failed_spy = undefined;

      beforeEach(function(done) {
        loaded_spy = jasmine.createSpy("on_loaded");
        load_failed_spy = jasmine.createSpy("on_loaded");
        testee.on("loaded", function() {
                              loaded_spy();
                              done();
                            })
              .on("load_failed", function() {
                                   load_failed_spy();
                                   done();
                                 })
              .load();
      });

      it("will trigger the loaded callback upon load", function(done) {
        expect(loaded_spy).toHaveBeenCalled();
        done();
      });

      it("will not trigger the load failed callback upon load", function(done) {
        expect(load_failed_spy).not.toHaveBeenCalled();
        done();
      });

      it("will deliver a usable API proxy as argument to the loaded callback", function(done) {
        expect(loaded_spy.calls.argsFor(0)).not.toBe(undefined);
        expect(loaded_spy.calls.argsFor(0)).not.toBeNull();
        done();
      });

      it("yields a non-empty d3 selection for existing selectors on nodes", function(done) {
        expect(d3.select(testee.nodes("")).empty()).toBe(false);
        expect(d3.select(testee.nodes("tag")).empty()).toBe(false);
        expect(d3.select(testee.nodes("tag [k=highway]")).empty()).toBe(false);
        done();
      });

      it("yields a non-empty d3 selection for existing selectors on ways", function(done) {
        expect(d3.select(testee.ways("")).empty()).toBe(false);
        expect(d3.select(testee.ways("tag")).empty()).toBe(false);
        expect(d3.select(testee.ways("tag [k=highway]")).empty()).toBe(false);
        done();
      });

      it("yields undefined when looking up nodes for some non-existing node reference", function(done) {
        expect(testee.node_by_reference("")).toBe(undefined);
        expect(testee.node_by_reference("foo")).toBe(undefined);
        expect(testee.node_by_reference("236")).toBe(undefined);
        done();
      });

      it("yields lat: 48.1066712 and lon: 11.4498138 when looking up node reference 96929019", function(done) {
        expect(testee.node_by_reference("96929019")).toEqual({ lat: '48.1066712', lon: '11.4498138' });
        done();
      });

    });

  });

});
