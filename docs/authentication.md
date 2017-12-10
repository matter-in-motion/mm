# Matter In Motion. Authentication

Matter in motion uses only time proven technologies

* Cryptographic passwords hashing [bcrypt](https://github.com/ncb000gt/node.bcrypt.js)
* [JSON Web Tokens](https://jwt.io) ([RFC 7519](https://tools.ietf.org/html/rfc7519)) encoding/decoding

As Matter In Motion created to build the APIs, by default, it provides user authentication provider. You can create any number of custom and standard providers.

## Usage

An example is the default user provider:

```js
  settings.core.auth = {
    user: {
      active: true,
      token: {
        key: 'mysupersecretkey',
        algorithm: 'HS256',
        expiresIn: '30 days',
        subject: 'user',
        issuer: 'https://myapp.com'
      },

      hash: 10
    }
  }
```

This will create `user` authentication provider. First, it will look for the custom provider in `resources.user.provider` unit. If not found it will create default one.

In the `core.auth` section you can define your own provider the same way as above.

## Settings

* __active__ — boolean. Active or not current provider
* __token__ — object. Token settings
  - __key__ —  is a string, buffer, or object containing either the secret for HMAC algorithms or the PEM encoded private key for RSA and ECDSA. In case of a private key with passphrase, an object { key, passphrase } can be used, in this case, be sure you pass the algorithm option
  - __algorithm__ — string. Algorithm, default 'HS256'
  - __expiresIn__ — string. Token expiration time span
  - __subject__ — string. Token subject it will be verified by
  - __audience__ — string.Token audience it will be verified by
  - __issuer__ — string. Token issuer it will be verified by
* __hash__ — number. Number of rounds for salt to be generated and used

## Methods

### `core.auth`

**provider(name)**

Returns provider

**verify(opts, meta)**

Verifies meta part of the message with auth options from the API description. Returns a promise.

### Provider

**sign(data, opts)**

Signs the `data` with default provider settings. `expiresIn`, `subject`, `audience` can be overridden by `opts`. And returns JSON Web Token. Returns a promise.

```js
{
 token : 'token',
 expires : 1500999915275, //timestamp
}
```

**verify(token, opts)**

Verifies JSON Web Token. Returns a promise with token data.

**createHash(string)**

Creates hash from the string, returns a Promise

**verifyHash(hash, string)**

Verifies hash and the string, returns a Promise
