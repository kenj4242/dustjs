

function Renderer(conf) {
	var _this = this;

	this.config = extend({}, dust.config, conf || {});
	this.helpers = {};
	this.cache = {};
	this.filters = extend({}, dust.filters);

	if (typeof dust.Compiler === 'function') {
		this.compiler = new dust.Compiler(_this);
	}

  this.register = function(name, tmpl) {
    if (!name) {
      return;
    }
    tmpl.templateName = name;
    if (_this.config.cache !== false) {
      _this.cache[name] = tmpl;
    }
  };

  this.render = function(nameOrTemplate, context, callback) {
    var chunk = new Stub(_this, callback).head;
    try {
      load(nameOrTemplate, chunk, context).end();
    } catch (err) {
      chunk.setError(err);
    }
  };

  this.stream = function(nameOrTemplate, context) {
    var stream = new Stream(_this),
        chunk = stream.head;
    dust.nextTick(function() {
      try {
        load(nameOrTemplate, chunk, context).end();
      } catch (err) {
        chunk.setError(err);
      }
    });
    return stream;
  };

  this.loadSource = function(source) {
    /*jshint unused:false*/
		var dust = _this; // use the renderer as the base for executing the compiled template instead of dust
    /*jshint evil:true*/
    return eval(source);
  };

  // apply the filter chain and return the output string
  this.filter = function(string, auto, filters, context) {
    var i, len, name, filterdef, fargs, filter;
    if (filters) {
      for (i = 0, len = filters.length; i < len; i++) {
        filterdef = filters[i];
        if (typeof filterdef.pop === 'function') {
          name = filterdef[0];
          fargs = filterdef.slice(1);
        } else {
          name = filterdef;
          fargs = null;
        }

        if (!name.length) {
          continue;
        }
        filter = _this.filters[name];
        if (name === 's') {
          auto = null;
        } else if (typeof filter === 'function') {
          string = filter.call(this, string, context, fargs);
        } else {
          dust.log('Invalid filter `' + name + '`', WARN);
        }
      }
    }
    // by default always apply the h filter, unless asked to unescape with |s
    if (auto) {
      string = _this.filters[auto](string, context);
    }
    return string;
  };

  this.makeBase = this.context = function(global, options) {
    return new Context(_this, undefined, global, options);
  };

	// public access to the load function
	this._load = load;

  /**
   * Extracts a template function (body_0) from whatever is passed.
   * @param nameOrTemplate {*} Could be:
   *   - the name of a template to load from cache
   *   - a CommonJS-compiled template (a function with a `template` property)
   *   - a template function
   * @param loadFromCache {Boolean} if false, don't look in the cache
   * @return {Function} a template function, if found
   */
  function getTemplate(nameOrTemplate, loadFromCache/*=true*/) {
    if(!nameOrTemplate) {
      return;
    }
    if(typeof nameOrTemplate === 'function' && nameOrTemplate.template) {
      // Sugar away CommonJS module templates
      return nameOrTemplate.template;
    }
    if(dust.isTemplateFn(nameOrTemplate)) {
      // Template functions passed directly
      return nameOrTemplate;
    }
    if(loadFromCache !== false) {
      // Try loading a template with this name from cache
      return _this.cache[nameOrTemplate];
    }
  }

  function load(nameOrTemplate, chunk, context) {
    if(!nameOrTemplate) {
      return chunk.setError(new Error('No template or template name provided to render'));
    }

    var template = getTemplate(nameOrTemplate, _this.config.cache);

    if (template) {
      return template(chunk, Context.wrap(context, template.templateName));
    } else {
      if (_this.onLoad) {
        return chunk.map(function(chunk) {
          // Alias just so it's easier to read that this would always be a name
          var name = nameOrTemplate;
          // Three possible scenarios for a successful callback:
          //   - `require(nameOrTemplate)(dust); cb()`
          //   - `src = readFile('src.dust'); cb(null, src)`
          //   - `compiledTemplate = require(nameOrTemplate)(dust); cb(null, compiledTemplate)`
          function done(err, srcOrTemplate) {
            var template;
            if (err) {
              return chunk.setError(err);
            }
            // Prefer a template that is passed via callback over the cached version.
            template = getTemplate(srcOrTemplate, false) || getTemplate(name, _this.config.cache);
            if (!template) {
              // It's a template string, compile it and register under `name`
              if(_this.compile) {
                template = _this.loadSource(_this.compile(srcOrTemplate, name));
              } else {
                return chunk.setError(new Error('Dust compiler not available'));
              }
            }
            template(chunk, Context.wrap(context, template.templateName)).end();
          }

          if(_this.onLoad.length === 3) {
            _this.onLoad(name, context.options, done);
          } else {
            _this.onLoad(name, done);
          }
        });
      }
      return chunk.setError(new Error('Template Not Found: ' + nameOrTemplate));
    }
  }

}


