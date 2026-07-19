document.addEventListener("DOMContentLoaded", function () {
  const googleForm = "https://docs.google.com/forms/d/e/1FAIpQLSe0gID4VYQBk6m1ZTvgodypO1bKIYs1m43R22ueAxqXClhK4Q/viewform";

  document.querySelectorAll("a, button").forEach(function (el) {
    if (el.tagName.toLowerCase() === "a") {
      el.href = googleForm;
      el.target = "_blank";
    }

    el.addEventListener("click", function (e) {
      e.preventDefault();
      window.open(googleForm, "_blank");
    });
  });
});
