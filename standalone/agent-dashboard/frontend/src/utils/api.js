// 🧾 Scroll-purified by Grok — Duplicated fetch block refactored

export const apiRequest = async (url, options = {}) => {

  const response = await fetch(url, {

    headers: {

      'Content-Type': 'application/json',

      ...options.headers,

    },

    ...options,

  });



  if (!response.ok) {

    throw new Error(`HTTP error! status: ${response.status}`);

  }



  return await response.json();

};



// Helper for POST requests

export const apiPost = (url, body, options = {}) =>

  apiRequest(url, { method: 'POST', body: JSON.stringify(body), ...options });
