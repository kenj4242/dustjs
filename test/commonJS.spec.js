var dust = require('../');

var ld = "{{";
var rd = "}}";

function load(dustr, tmpl, name) {
  /*jshint evil:true*/
  return eval(dustr.compile(tmpl, name))(dustr);
}

describe('CommonJS template', function() {
  var template = "Hello "+ld+"world"+rd+"!",
      context = { world: "world" },
      rendered = "Hello world!",
      tmpl, dustr;

  beforeAll(function() {
    dust.config.cjs = true;
    //dust.cache = {};
		dustr = dust.engine();
  });

  afterAll(function() {
    dust.config.cjs = false;
  });

  beforeEach(function() {
    tmpl = load(dustr, template, 'hello');
    dustr.onLoad = undefined;
  });

  it('can be invoked to render', function() {
    tmpl(context, function(err, out) {
      expect(out).toEqual(rendered);
    });
  });

  it('can be invoked to stream', function(done) {
    tmpl(context).on('data', function(out) {
      expect(out).toEqual(rendered);
      done();
    });
  });

  it('can be passed to dustr.render', function() {
    dustr.render(tmpl, context, function(err, out) {
      expect(out).toEqual(rendered);
    });
  });

  it('can be passed to dustr.stream', function(done) {
    dustr.stream(tmpl, context).on('data', function(out) {
      expect(out).toEqual(rendered);
      done();
    });
  });

  it('has a template property that can be passed to dustr.render', function() {
    dustr.render(tmpl.template, context, function(err, out) {
      expect(out).toEqual(rendered);
    });
  });

  it('has a name that can be passed to dustr.render', function() {
    dustr.render(tmpl.template.templateName, context, function(err, out) {
      expect(out).toEqual(rendered);
    });
  });

  it('can be passed to dustr.render even if it is anonymous', function() {
    tmpl = load(dustr, "Hello anonymous "+ld+"world"+rd+"!");
    dustr.render(tmpl, context, function(err, out) {
      expect(out).toEqual("Hello anonymous world!");
    });
  });

  it('can be loaded via dustr.onLoad', function() {
    dustr.onLoad = function(nameOrTemplate, callback) {
      // Haha, you asked for some random template but we will always give you ours instead
      callback(null, tmpl);
    };
    dustr.render('foobar', context, function(err, out) {
      expect(out).toEqual(rendered);
    });
  });
});
