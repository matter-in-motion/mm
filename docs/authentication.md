# Matter In Motion. Authentication

Matter in motion uses only time-proven technologies

* Cryptographic passwords hashing [bcrypt](https://github.com/ncb000gt/node.bcrypt.js)
* [JSON Web Tokens](https://jwt.io) ([RFC 7519](https://tools.ietf.org/html/rfc7519)) encoding/decoding

As Matter In Motion created to build the APIs, by default, it provides a simple way for authentication. You can create any number of custom and standard providers.

## Usage

An example of the user provider:

```js
  settings.auth = {
    default: 'user',
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

This creates a `user` authentication provider. At startup, the application looks for the custom provider `resources.user.provider` unit. If custom provider not found it creates the default one.

`default` property in the settings defines the default auth provider. Default provider is used when no provider defined in the API call schema.

## Settings

* __active__ — boolean. Defines if the current provider is active or not. You can change it at runtime.
* __token__ — object. Token settings.
  - __key__ —  is a string, buffer, or object containing either the secret for HMAC algorithms or the PEM encoded private key for RSA and ECDSA. If a private key has a passphrase, use the object { key, passphrase }. In this case, be sure you pass the algorithm option.
  - __algorithm__ — string. Algorithm, default 'HS256'.
  - __expiresIn__ — string. Token expiration time span.
  - __subject__ — string. Token subject.
  - __audience__ — string. Token audience.
  - __issuer__ — string. Token issuer.
* __hash__ — number. Number of rounds of salt to be generated and used

## Methods

### `core.auth`

**provider(name)**

Returns provider

**verify(opts, meta)**

Verifies meta part of the message with auth options from the API description. Returns a promise.

### Provider

**sign(data, opts)**

Signs the `data` with default provider settings. `expiresIn`, `subject`, `audience` can be overridden by `opts`. Returns a promise with JSON Web Token.

```js
{
 token : 'token',
 expires : 1500999915275, //timestamp
}
```

**verify(token, opts)**

Verifies JSON Web Token. Returns a promise with token data.

**createHash(string)**

Creates a hash from the string, returns a Promise.

**verifyHash(hash, string)**

Verifies hash and the string. Returns a Promise
