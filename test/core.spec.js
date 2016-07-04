(function (root, factory) {
  if (typeof exports === 'object') {
    factory(require('../'));
  } else {
    factory(root.dust);
  }
}(this, function(dust) {

	var ld = "{{";
	var rd = "}}";

	function subDelimiters(str) {
		return str.replace(/\{/g, ld).replace(/\}/g, rd);
	}

  function extend(target, donor) {
    donor = donor || {};
    for(var prop in donor) {
      target[prop] = donor[prop];
    }
    return target;
  }

  function renderIt(dustr, message, source, context, expected, config) {
		source = subDelimiters(source);
		expected = subDelimiters(expected);
    var tmpl = dustr.loadSource(dustr.compile(source));
    dustr.config = extend({ whitespace: false, amd: false, cjs: false, cache: true }, config);
    it(message, function(done) {
      render(dustr, tmpl, context, expected)(done);
    });
  }

  function render(dustr, tmpl, context, expected) {
    return function(done) {
      dustr.render(tmpl, context, function(err, output) {
        expect(err).toBe(null);
        expect(output).toEqual(expected);
        done();
      });
    };
  }

  function templateName(chunk, context) {
    return context.getTemplateName();
  }

  describe('Context', function() {
    describe("render", function() {
			var dustr = dust.renderer();
      var base = dustr.makeBase({
        sayHello: function() { return "Hello!"; },
        names: ["Alice", "Bob", "Dusty"]
      });
      it("doesn't push onto the stack if data is undefined", function() {
        expect(base.push().push().push().push().stack).toBe(undefined);
      });
      renderIt(dustr, "can read from both globals and context", "{sayHello} {foo}", base.push({foo: "bar"}), "Hello! bar");
      renderIt(dustr, "doesn't error if globals are empty", "{sayHello} {foo}", dustr.makeBase().push({foo: "bar"}), " bar");
      renderIt(dustr, "doesn't error if context is undefined", "{sayHello} {foo}", undefined, " ");
      renderIt(dustr, "can iterate over an array in the globals", "{sayHello} {#names}{.} {/names}", base, "Hello! Alice Bob Dusty ");
    });

    describe('templateName', function() {
      var context = {
        templateName: templateName
      };
			var dustr = dust.renderer();
      var tmpl = dustr.loadSource(dustr.compile("template name is "+ld+"templateName"+rd+"", "templateNameTest"));
      it("sets the template name on context",
        render(dustr, tmpl, context, "template name is templateNameTest"));
      it("sets the template name when provided a context",
        render(dustr, tmpl, dustr.context(context), "template name is templateNameTest"));
    });

    describe('options', function() {
      it('sets options using makeBase / context', function() {
        var opts = { lang: "fr" },
            globals = { hello: "world" };
				var dustr = dust.renderer();
        var base = dustr.context(globals, opts);
        expect(base.options.lang).toEqual(opts.lang);
        base = base.rebase();
        expect(base.options.lang).toEqual(opts.lang);
      });
    });
  });

  it("valid keys", function() {
		var dustr = dust.renderer();
    renderIt(dustr, "Renders all valid keys", "{_foo}{$bar}{baz1}", {_foo: 1, $bar: 2, baz1: 3}, "123");
  });

  describe('dust.onLoad', function() {

		var dustr = dust.renderer();

    beforeEach(function() {
      dustr.cache.onLoad = null;
    });
    it("calls callback with source", function(done) {
      dustr.onLoad = function(name, cb) {
        cb(null, 'Loaded: ' + name + ", template name "+ld+"templateName"+rd+"");
      };
      render(dustr, "onLoad", {
        templateName: templateName
      }, "Loaded: onLoad, template name onLoad")(done);
    });
    it("calls callback with compiled template", function(done) {
      dustr.onLoad = function(name, cb) {
        var tmpl = dustr.loadSource(dustr.compile('Loaded: ' + name + ', template name '+ld+'templateName'+rd+'', 'foobar'));
        cb(null, tmpl);
      };
      render(dustr, "onLoad", {
        templateName: templateName
      }, "Loaded: onLoad, template name foobar")(done);
    });
    it("calls callback with compiled template and can override template name", function(done) {
      dustr.onLoad = function(name, cb) {
        var tmpl = dustr.loadSource(dustr.compile('Loaded: ' + name + ', template name '+ld+'templateName'+rd+'', 'foobar'));
        tmpl.templateName = 'override';
        cb(null, dustr.cache.foobar);
      };
      render(dustr, "onLoad", {
        templateName: templateName
      }, "Loaded: onLoad, template name override")(done);
    });
    it("receives context options", function(done) {
      dustr.onLoad = function(name, opts, cb) {
        cb(null, 'Loaded: ' + name + ', lang ' + opts.lang);
      };
      render(dustr, "onLoad", dustr.makeBase(null, { lang: "fr" }), "Loaded: onLoad, lang fr")(done);
    });
  });

  describe('dust.config.cache', function() {
		var dustr = dust.renderer();
    beforeAll(function() {
      dustr.config.cache = false;
    });
    afterAll(function() {
      dustr.config.cache = true;
    });
    it('turns off cache registration', function() {
      dustr.loadSource(dustr.compile('Not cached', 'test'));
      expect(dustr.cache.test).toBe(undefined);
    });
    it('calls onLoad every time for a template', function(done) {
      var tmpl = "Version 1";
      dustr.onLoad = function(name, cb) {
        cb(null, tmpl);
      };
      dustr.render('test', undefined, function(err, out) {
        expect(out).toEqual(tmpl);
        tmpl = "Version 2";
        dustr.render('test', undefined, function(err, out) {
          expect(out).toEqual(tmpl);
          done();
        });
      });
    });
    it('does not clobber a cached template', function() {
      dustr.cache.test = 'test';
      dustr.loadSource(dustr.compile('Not cached', 'test'));
      expect(dustr.cache.test).toEqual('test');
    });
  });

  describe('renderSource', function() {
		var dustr = dust.renderer();
    var template = "Hello "+ld+"world"+rd+"!",
        expected = "Hello world!",
        ctx = {world: "world"};

    it('invokes a callback', function(done) {
      dustr.renderSource(template, ctx, function(err, out) {
        expect(err).toBe(null);
        expect(out).toBe(expected);
        done();
      });
    });

    it('streams', function(done) {
      dustr.renderSource(template, ctx).on('data', function(out) {
        expect(out).toBe(expected);
        done();
      });
    });

    it('streams to every listener', function(done) {
      var recipients = 0;
      var stream = dustr.renderSource(template, ctx);
      var func = function(out) {
        expect(out).toBe(expected);
        recipients--;
      };

      while(recipients < 10) {
        stream.on('data', func);
        recipients++;
      }

      stream.on('end', function() {
        expect(recipients).toBe(0);
        done();
      });
    });

    it('pipes', function(done) {
      var gotData = false;
      dustr.renderSource(template, ctx).pipe({
        write: function(out) {
          expect(out).toBe(expected);
          gotData = true;
        },
        end: function() {
          expect(gotData).toBe(true);
          done();
        }
      });
    });
  });

  describe('compileFn', function() {
		var dustr = dust.renderer();
    var ctx = {world:"World"},
        expected = 'Hello World',
        tmpl;
    beforeAll(function() {
      tmpl = dustr.compileFn('Hello '+ld+'world'+rd+'');
    });
    it('can be invoked as a function', function(done) {
      tmpl(ctx, function(err, out) {
        expect(out).toEqual(expected);
        done();
      });
    });
    it('emits events like a stream', function(done) {
      tmpl(ctx).on('data', function(out) {
        expect(out).toEqual(expected);
        done();
      });
    });
  });

}));
