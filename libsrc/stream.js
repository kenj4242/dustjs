
	/********************************************************
	* Stream Object
	********************************************************/
  /**
   * Creates an interface sort of like a Streams2 ReadableStream.
   */
  function Stream(renderer) {
		this.renderer = renderer;
    this.head = new Chunk(this.renderer, this);
  }

  Stream.prototype.flush = function() {
    var chunk = this.head;

    while(chunk) {
      if (chunk.flushable) {
        this.emit('data', chunk.data.join('')); //ie7 perf
      } else if (chunk.error) {
        this.emit('error', chunk.error);
        this.emit('end');
        dust.log('Streaming failed with error `' + chunk.error + '`', ERROR);
        this.flush = EMPTY_FUNC;
        return;
      } else {
        return;
      }
      chunk = chunk.next;
      this.head = chunk;
    }
    this.emit('end');
  };

  /**
   * Executes listeners for `type` by passing data. Note that this is different from a
   * Node stream, which can pass an arbitrary number of arguments
   * @return `true` if event had listeners, `false` otherwise
   */
  Stream.prototype.emit = function(type, data) {
    var events = this.events || {},
        handlers = events[type] || [],
        i, l;

    if (!handlers.length) {
      dust.log('Stream broadcasting, but no listeners for `' + type + '`', DEBUG);
      return false;
    }

    handlers = handlers.slice(0);
    for (i = 0, l = handlers.length; i < l; i++) {
      handlers[i](data);
    }
    return true;
  };

  Stream.prototype.on = function(type, callback) {
    var events = this.events = this.events || {},
        handlers = events[type] = events[type] || [];

    if(typeof callback !== 'function') {
      dust.log('No callback function provided for `' + type + '` event listener', WARN);
    } else {
      handlers.push(callback);
    }
    return this;
  };

  /**
   * Pipes to a WritableStream. Note that backpressure isn't implemented,
   * so we just write as fast as we can.
   * @param stream {WritableStream}
   * @return self
   */
  Stream.prototype.pipe = function(stream) {
    if(typeof stream.write !== 'function' ||
       typeof stream.end !== 'function') {
      dust.log('Incompatible stream passed to `pipe`', WARN);
      return this;
    }

    var destEnded = false;

    if(typeof stream.emit === 'function') {
      stream.emit('pipe', this);
    }

    if(typeof stream.on === 'function') {
      stream.on('error', function() {
        destEnded = true;
      });
    }

    return this
    .on('data', function(data) {
      if(destEnded) {
        return;
      }
      try {
        stream.write(data, 'utf8');
      } catch (err) {
        dust.log(err, ERROR);
      }
    })
    .on('end', function() {
      if(destEnded) {
        return;
      }
      try {
        stream.end();
        destEnded = true;
      } catch (err) {
        dust.log(err, ERROR);
      }
    });
  };


