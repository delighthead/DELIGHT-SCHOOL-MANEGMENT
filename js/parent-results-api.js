document.addEventListener("DOMContentLoaded", function () {
  const resultsTableBody = document.getElementById("parentResultsTableBody");
  const resultsCountText = document.getElementById("parentResultsCountText");

  function getAuthOnlyHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  }

  function oneDecimal(value) {
    return Number(value || 0).toFixed(1);
  }

  async function loadParentResults() {
    if (!resultsTableBody) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/api/parents/my/scores", {
        headers: getAuthOnlyHeaders()
      });

      const data = await response.json();

      resultsTableBody.innerHTML = "";

      if (!response.ok) {
        resultsTableBody.innerHTML = `
          <tr>
            <td colspan="12">${data.message || "Could not load results."}</td>
          </tr>
        `;
        if (resultsCountText) resultsCountText.textContent = "";
        return;
      }

      const scores = data.scores || [];

      if (resultsCountText) {
        resultsCountText.textContent = `Showing ${scores.length} approved result record(s)`;
      }

      if (scores.length === 0) {
        resultsTableBody.innerHTML = `
          <tr>
            <td colspan="12">No approved results found for active children.</td>
          </tr>
        `;
        return;
      }

      const gradingSettings = await getGradingSettings();

      scores.forEach(function (score) {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${score.student_name || ""}</td>
          <td>${score.admission_number || ""}</td>
          <td>${score.class_name || ""}</td>
          <td>${score.subject || ""}</td>
          <td>${score.term || ""}</td>
          <td>${score.academic_year || ""}</td>
          <td>${oneDecimal(score.assessment_score)}</td>
          <td>${oneDecimal(score.examination_score)}</td>
          <td>${oneDecimal(score.total_score)}</td>
          <td>${calculateGradeFromSettings(score.total_score, gradingSettings).grade || score.grade || ""}</td>
          <td>${score.position || ""}</td>
          <td>${calculateGradeFromSettings(score.total_score, gradingSettings).remark || score.remarks || ""}</td>
        `;

        resultsTableBody.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      resultsTableBody.innerHTML = `
        <tr>
          <td colspan="12">Cannot connect to backend.</td>
        </tr>
      `;
      if (resultsCountText) resultsCountText.textContent = "";
    }
  }

  loadParentResults();
});
