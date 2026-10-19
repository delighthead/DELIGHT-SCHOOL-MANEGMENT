const db = require("../config/database");

// Resolve active school branches without assuming database IDs.
async function getAnnouncementBranchIds() {
  const [rows] = await db.query(`
    SELECT id, branch_name
    FROM branches
    WHERE status = 'active'
      AND (
        UPPER(branch_name) LIKE '%KOTOBABI%'
        OR UPPER(branch_name) LIKE '%OFANKOR%'
      )
    ORDER BY id
  `);

  const kotobabi = rows.filter(row =>
    /KOTOBABI/i.test(row.branch_name)
  );

  const ofankor = rows.filter(row =>
    /OFANKOR/i.test(row.branch_name)
  );

  if (kotobabi.length !== 1 || ofankor.length !== 1) {
    throw new Error(
      "Expected exactly one active Kotobabi branch " +
      "and one active Ofankor branch."
    );
  }

  const kotobabiId = Number(kotobabi[0].id);
  const ofankorId = Number(ofankor[0].id);

  if (
    !Number.isSafeInteger(kotobabiId) ||
    !Number.isSafeInteger(ofankorId) ||
    kotobabiId <= 0 ||
    ofankorId <= 0 ||
    kotobabiId === ofankorId
  ) {
    throw new Error("Invalid announcement branch configuration.");
  }

  return {
    kotobabiId,
    ofankorId,
    schoolBranchIds: [kotobabiId, ofankorId]
  };
}

module.exports = { getAnnouncementBranchIds };
