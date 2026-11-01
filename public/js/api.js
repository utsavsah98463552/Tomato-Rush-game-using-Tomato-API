/**
 * api.js - every HTTP call from the browser to my server goes through here.
 * Author: Utsav Sah
 *
 * Protocol between browser and server: HTTP + JSON (a small REST API).
 */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, url, body) {
  const options = {
    method,
    headers: { Accept: 'application/json' },
    credentials: 'same-origin', // send cookies to my own server only
  };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status);
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body = {}) => request('POST', url, body),
};
