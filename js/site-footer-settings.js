document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/settings");
    const data = await response.json();

    if (!response.ok) return;

    const settings = data.settings || {};

    const schoolName = settings.school_name || "Delight International School";
    const motto = settings.school_motto || "";
    const phone = settings.school_phone || "";
    const email = settings.school_email || "";
    const address = settings.school_address || "";

    // Update footer if footer exists
    const footers = document.querySelectorAll("footer, .footer");

    footers.forEach(footer => {
      footer.innerHTML = `
        <div class="footer-settings-box">
          <h3>${schoolName}</h3>
          <p><strong>Motto:</strong> ${motto}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Address:</strong> ${address}</p>
          <p class="footer-copy">&copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
        </div>
      `;
    });

    // Also update contact page fields if they exist
    const contactSchoolName = document.getElementById("contactSchoolName");
    const contactMotto = document.getElementById("contactMotto");
    const contactPhone = document.getElementById("contactPhone");
    const contactEmail = document.getElementById("contactEmail");
    const contactAddress = document.getElementById("contactAddress");

    if (contactSchoolName) contactSchoolName.textContent = schoolName;
    if (contactMotto) contactMotto.textContent = motto;
    if (contactPhone) contactPhone.textContent = phone;
    if (contactEmail) contactEmail.textContent = email;
    if (contactAddress) contactAddress.textContent = address;

  } catch (error) {
    console.error("Could not load footer settings:", error);
  }
});
