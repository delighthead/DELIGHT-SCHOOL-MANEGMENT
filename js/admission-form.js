document.addEventListener("DOMContentLoaded", function () {
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSe0gID4VYQBk6m1ZTvgodypO1bKIYs1m43R22ueAxqXClhK4Q/viewform?usp=header";

  const forms = Array.from(document.querySelectorAll("form"));

  const admissionForm = forms.find(form => {
    const text = form.innerText.toLowerCase();
    return (
      text.includes("parent name") ||
      text.includes("child name") ||
      text.includes("class applying")
    );
  });

  if (!admissionForm) return;

  admissionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    window.open(googleFormUrl, "_blank");
  });

  const submitBtn = admissionForm.querySelector("button[type='submit'], input[type='submit']");
  if (submitBtn) {
    submitBtn.textContent = "Open Admission Form";
  }
});
