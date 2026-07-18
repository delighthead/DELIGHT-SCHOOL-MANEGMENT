(function () {
  const API_BASE = "http://127.0.0.1:5000";

  window.API_BASE = API_BASE;

  window.getAuthToken = function () {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      ""
    );
  };

  window.getAuthHeaders = function () {
    const token = window.getAuthToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  window.getAuthOnlyHeaders = function () {
    const token = window.getAuthToken();

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Automatically add Authorization header to all backend API requests
  const originalFetch = window.fetch;

  window.fetch = function (url, options = {}) {
    const token = window.getAuthToken();

    const isApiRequest =
      typeof url === "string" &&
      (
        url.startsWith("http://127.0.0.1:5000/api") ||
        url.startsWith("http://localhost:5000/api") ||
        url.startsWith("/api")
      );

    if (isApiRequest && token) {
      options.headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      };
    }

    return originalFetch(url, options);
  };
})();
