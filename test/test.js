var assert = require('assert')
var crypto = require('crypto')
var proxyquire = require('proxyquire')

var Promise = global.Promise || require('bluebird')

var randomBytes = proxyquire('..', {
  crypto: {
    randomBytes: cryptoRandomBytes
  }
})

// Add Promise to mocha's global list
global.Promise = global.Promise

describe('randomBytes(size)', function () {
  describe('with global Promise', function () {
    before(function () {
      global.Promise = Promise
    })

    after(function () {
      global.Promise = undefined
    })

    it('should return a Buffer of the correct length', function () {
      return randomBytes(18).then(function (buf) {
        assert.ok(Buffer.isBuffer(buf))
        assert.strictEqual(18, buf.length)
      })
    })

    describe('when PRNG not seeded', function () {
      afterEach(function () {
        cryptoRandomBytes.seeded = undefined
      })

      it('should still generate bytes when later seeded', function () {
        cryptoRandomBytes.seeded = 1

        return randomBytes(18).then(function (buf) {
          assert.ok(Buffer.isBuffer(buf))
          assert.strictEqual(18, buf.length)
        })
      })

      it('should attempt generation three times', function () {
        cryptoRandomBytes.seeded = 2

        return randomBytes(18).then(function (buf) {
          assert.ok(Buffer.isBuffer(buf))
          assert.strictEqual(18, buf.length)
        })
      })

      it('should reject if never seeded', function () {
        cryptoRandomBytes.seeded = false

        return randomBytes(18).then(unexpectedResolve, function (err) {
          assert.notStrictEqual(err.message.indexOf('PRNG not seeded'), -1)
        })
      })
    })
  })

  describe('without global Promise', function () {
    before(function () {
      global.Promise = undefined
    })

    after(function () {
      global.Promise = Promise
    })

    it('should require callback', function () {
      assert.throws(function () {
        randomBytes(18)
      }, /argument callback.*required/)
    })

    it('should error for bad callback', function () {
      assert.throws(function () {
        randomBytes(18, 'silly')
      }, /argument callback.*function/)
    })

    it('should return a Buffer of the correct length', function (done) {
      randomBytes(18, function (err, buf) {
        if (err) return done(err)
        assert.ok(Buffer.isBuffer(buf))
        assert.strictEqual(18, buf.length)
        done()
      })
    })

    describe('when PRNG not seeded', function () {
      afterEach(function () {
        cryptoRandomBytes.seeded = undefined
      })

      it('should still generate bytes when later seeded', function (done) {
        cryptoRandomBytes.seeded = 1

        randomBytes(18, function (err, buf) {
          if (err) return done(err)
          assert.ok(Buffer.isBuffer(buf))
          assert.strictEqual(18, buf.length)
          done()
        })
      })

      it('should attempt generation three times', function (done) {
        cryptoRandomBytes.seeded = 2

        randomBytes(18, function (err, buf) {
          if (err) return done(err)
          assert.ok(Buffer.isBuffer(buf))
          assert.strictEqual(18, buf.length)
          done()
        })
      })

      it('should error if never seeded', function (done) {
        cryptoRandomBytes.seeded = false

        randomBytes(18, function (err) {
          assert.ok(err)
          assert.notStrictEqual(err.message.indexOf('PRNG not seeded'), -1)
          done()
        })
      })
    })
  })
})

describe('randomBytes.sync()', function () {
  it('should return a Buffer of the correct length', function () {
    var buf = randomBytes.sync(18)
    assert.ok(Buffer.isBuffer(buf))
    assert.strictEqual(18, buf.length)
  })

  describe('when PRNG not seeded', function () {
    afterEach(function () {
      cryptoRandomBytes.seeded = undefined
    })

    it('should still generate bytes when later seeded', function () {
      cryptoRandomBytes.seeded = 1

      var buf = randomBytes.sync(18)
      assert.ok(Buffer.isBuffer(buf))
      assert.strictEqual(18, buf.length)
    })

    it('should attempt generation three times', function () {
      cryptoRandomBytes.seeded = 2

      var buf = randomBytes.sync(18)
      assert.ok(Buffer.isBuffer(buf))
      assert.strictEqual(18, buf.length)
    })

    it('should error if never seeded', function () {
      cryptoRandomBytes.seeded = false

      assert.throws(randomBytes.sync.bind(randomBytes, 18), /PRNG not seeded/)
    })
  })
})

function cryptoRandomBytes (size, callback) {
  if (cryptoRandomBytes.seeded === undefined) {
    return crypto.randomBytes(size, callback)
  }

  // The crazy not seeded error
  var err = new Error('error:24064064:random number generator:SSLEAY_RAND_BYTES:PRNG not seeded')

  if (typeof cryptoRandomBytes.seeded === 'number' && !--cryptoRandomBytes.seeded) {
    // Reset seeded state
    cryptoRandomBytes.seeded = undefined
  }

  if (!callback) {
    throw err
  }

  callback(err)
}

function unexpectedResolve () {
  throw new Error('unexpected resolve')
}
