(function () {
  function normalizeToken() {
    const possibleToken =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("authToken");

    if (possibleToken) {
      localStorage.setItem("token", possibleToken);
    }

    return possibleToken;
  }

  window.getSystemToken = function () {
    return normalizeToken();
  };

  normalizeToken();
})();
