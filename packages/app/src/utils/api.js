const origin = process.env.REACT_APP_API_URL
  // When deploying using docker, use the API_URL env variable to proxy to the
  // egapro-api image. See the server.js file for the proxy configuration.
  ? "/api"
  // If this REACT_APP_API_URL env variable isn't present, we're in local
  // development, so no proxy.
  : "http://localhost:4000/api";

const commonHeaders = {
  Accept: "application/json"
};

const commonContentHeaders = {
  ...commonHeaders,
  "Content-Type": "application/json"
};

////////////

class ApiError extends Error {
  constructor(response, jsonBody, ...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
    this.response = response;
    this.jsonBody = jsonBody;
  }
}

function checkStatusAndParseJson(response) {
  if (response.status === 204) {
    return { response };
  }

  let jsonPromise = response.json(); // there's always a body
  if (response.status >= 200 && response.status < 300) {
    return jsonPromise.then(jsonBody => ({ response, jsonBody }));
  } else {
    return jsonPromise.then(jsonBody => {
      const apiError = new ApiError(response, jsonBody);
      return Promise.reject.bind(Promise)(apiError);
    });
  }
}

/////////////

function fetchResource(method, pathname, body) {
  const requestObj = {
    method,
    headers: body ? commonContentHeaders : commonHeaders,
    body: body ? JSON.stringify(body) : undefined
  };

  return fetch(origin + pathname, requestObj).then(checkStatusAndParseJson);
}

const getResource = pathname => fetchResource("GET", pathname);
const postResource = (pathname, body) => fetchResource("POST", pathname, body);
const putResource = (pathname, body) => fetchResource("PUT", pathname, body);

/////////////

export const getIndicatorsDatas = id => getResource(`/indicators-datas/${id}`);

export const postIndicatorsDatas = data =>
  postResource("/indicators-datas", data);

export const putIndicatorsDatas = (id, data) =>
  putResource(`/indicators-datas/${id}`, { id, data });

export const sendEmailIndicatorsDatas = (id, email) =>
  postResource(`/indicators-datas/${id}/emails`, { email });
