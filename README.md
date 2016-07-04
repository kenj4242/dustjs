This fork is substantially changed from the original linkedin dustjs project from which it was forked. If you're looking for "vanilla" dustjs, you should go to that project [https://github.com/linkedin/dustjs].

## Changes from original DustJS

Dust tags are delimited by DOUBLE curly-braces, instead of single. Example {{key}}

Spaces are allowed in dust tags, so {{ key}} {{ key }} {{key }} are all valid.

Spaces are allowed around filters, so {{ key | filter }} works.

Filters can take inline arguments, using a ":" as the argument separator, similar to AngularJS filters. Example: {{ key | filter : arg1 : arg2 }}. Filter arguments are passed to the filter function as an array, so the filter signature becomes: function(value, context, args[]).

Filter arguments may be literals, or keys that will be resolved from the context.

The dust renderer is now instanced, multiple dust engine instances can be created with different filters, helpers, onLoad and cache. The global dust object no longer contains any of the load, compile, or render methods. These methods are all moved to dust engine instances. 

Example:

    var engine = dust.engine();
    
    engine.filters.myfilter = function() {};
    engine.helpers.myhelper = function() {};
    engine.onLoad = function() {};
    
    var compiled = engine.compile("<h1>{{ title }}</h1>");
    var tmpl = engine.loadSource(compiled);

    engine.render(tmpl, { title: "My Title" }, function(err, out) {
        console.log(out);
    });

Global configuration may still be added to the global dust object, and that configuration will be copied into any subsequently instantiated engine objects.

See the standard dustjs docs for more info on "normal" dust syntax [dustjs.com](http://www.dustjs.com/)
