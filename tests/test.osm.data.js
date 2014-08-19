describe("OSM XML accessor API osm.data", function() {

  describe("A vanilla OSM XML accessor API", function() {
    var testee;

    beforeEach(function() {
      testee = osm.data();
    });

    afterEach(function() {
      testee = undefined;
    });

    it("has node caching enabled", function() {
      expect(testee.caching()).toBe(true);
    });

    it("has no source defined", function() {
      expect(testee.source()).toBe(undefined);
    });

    describe("when setting node caching to false", function() {
      beforeEach(function() {
        testee.caching(false);
      });

      it("has node caching disabled", function() {
        expect(testee.caching()).toBe(false);
      });
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

    it("has node caching enabled", function() {
      expect(testee.caching()).toBe(true);
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
    });

  });
});
