export const coerceToArrayBuffer = (input: any) => {
  let result = input;
  if (typeof result === 'string') {
    // base64url to base64
    result = result.replace(/-/g, '+').replace(/_/g, '/');

    // base64 to Uint8Array
    var str = window.atob(result);
    var bytes = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    result = bytes;
  }

  // Array to Uint8Array
  if (Array.isArray(result)) {
    result = new Uint8Array(result);
  }

  // Uint8Array to ArrayBuffer
  if (result instanceof Uint8Array) {
    result = result.buffer;
  }

  // error if none of the above worked
  if (!(result instanceof ArrayBuffer)) {
    throw new TypeError('could not coerce to ArrayBuffer');
  }

  return result;
};

export const coerceToBase64Url = (input: any) => {
  let result = input;
  // Array or ArrayBuffer to Uint8Array
  if (Array.isArray(result)) {
    result = Uint8Array.from(result);
  }

  if (result instanceof ArrayBuffer) {
    result = new Uint8Array(result);
  }

  // Uint8Array to base64
  if (result instanceof Uint8Array) {
    var str = '';
    var len = result.byteLength;

    for (var i = 0; i < len; i++) {
      str += String.fromCharCode(result[i]);
    }
    result = window.btoa(str);
  }

  if (typeof result !== 'string') {
    throw new Error('could not coerce to string');
  }

  // base64 to base64url
  // NOTE: "=" at the end of challenge is optional, strip it off here
  result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/g, '');

  return result;
};
