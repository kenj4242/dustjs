(function (root, factory) {
  if (typeof exports === 'object') {
    factory(require('../../'), require('ayepromise'));
  } else {
    factory(root.dust, root.ayepromise);
  }
}(this, function(dust, ayepromise) {

	dust.helpers = dust.helpers || {};

  dust.helpers.error = function(chunk, context, bodies, params) {
    throw params.errorMessage;
  };
  dust.helpers.promise = function(chunk, context, bodies, params) {
    var defer = ayepromise.defer();
    if (params.reject) {
      defer.reject(params.reject);
    } else {
      defer.resolve(params.resolve);
    }
    return defer.promise;
  };
  dust.helpers.val = function(chunk, context, bodies, params) {
    var val = params.value;
    if(dust.isTemplateFn(val)) {
      return val(chunk, context);
    }
    return val;
  };
  dust.filters.woo = function(string, context) {
    var wooLevel = parseInt(context.get('woo')) + 1;
    return string.toUpperCase() + new Array(wooLevel).join('!');
  };
  dust.filters.wooargs = function(string, context, args) {
		var woochar = args[1] || '!';
    var wooLevel = parseInt(args[0]) + 1;
    return string.toUpperCase() + new Array(wooLevel).join(woochar);
  };
}));
