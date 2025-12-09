// === CONFIG À ADAPTER ===
const AIRTABLE_TOKEN = "pat4fty9LQiGlFlSg.93f9e9249dd6fe0965f79ec94694f101f70418bd76e8d237f33b719c8d681255";
const AIRTABLE_BASE_ID = "appdiovvzoc0Cubaw";
const AIRTABLE_TABLE_NAME = "Repas Noel";
const AIRTABLE_PURCHASE_TABLE_NAME = "Achats";

const AIRTABLE_URL = `https://api.airtable.com/v0/${encodeURIComponent(
  AIRTABLE_BASE_ID
)}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

const AIRTABLE_PURCHASE_URL = `https://api.airtable.com/v0/${encodeURIComponent(
  AIRTABLE_BASE_ID
)}/${encodeURIComponent(AIRTABLE_PURCHASE_TABLE_NAME)}`;

// === Compteur avant Noël ===
function updateCountdown() {
  const countdownEl = document.getElementById("countdown");
  const now = new Date();
  const thisYear = now.getFullYear();
  const christmas = new Date(`${thisYear}-12-25T00:00:00`);
  const diff = christmas - now;

  if (diff <= 0) {
    countdownEl.textContent = "Joyeux Noël ! 🎅🎄";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  countdownEl.textContent = `Plus que ${days} jour${days > 1 ? "s" : ""} avant Noël 🎁`;
}

// === Année en bas de page ===
document.getElementById("year").textContent = new Date().getFullYear();

// === Neige ===
function createSnowflakes() {
  const container = document.getElementById("snow-container");
  if (!container) return;

  const NUM_FLAKES = 60;

  for (let i = 0; i < NUM_FLAKES; i++) {
    const span = document.createElement("span");
    span.className = "snowflake";
    span.textContent = "❆";

    const size = 8 + Math.random() * 10;
    span.style.left = Math.random() * 100 + "vw";
    span.style.fontSize = size + "px";
    span.style.animationDuration = 8 + Math.random() * 8 + "s";
    span.style.animationDelay = Math.random() * 10 + "s";

    container.appendChild(span);
  }
}

// === Musique & son de cloche ===
const musicToggleBtn = document.getElementById("music-toggle");
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");

if (musicToggleBtn && bgMusic) {
  musicToggleBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic
        .play()
        .then(() => {
          musicToggleBtn.textContent = "🎶 Couper la musique de Noël";
          musicToggleBtn.classList.add("active");
        })
        .catch(() => {
          // Certains navigateurs bloquent l'auto-play, on ignore
        });
    } else {
      bgMusic.pause();
      musicToggleBtn.textContent = "🎶 Activer la musique de Noël";
      musicToggleBtn.classList.remove("active");
    }
  });
}

function playClickSound() {
  if (!clickSound) return;
  try {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  } catch (e) {
    console.error("Erreur lecture son :", e);
  }
}

// === Gestion du champ "Divers" ===
const platSelect = document.getElementById("plat");
const diversField = document.getElementById("divers-field");
const diversInput = document.getElementById("plat-divers");

platSelect.addEventListener("change", () => {
  if (platSelect.value === "Divers") {
    diversField.style.display = "block";
    diversInput.required = true;
  } else {
    diversField.style.display = "none";
    diversInput.required = false;
    diversInput.value = "";
  }
});

// === Récupération des contributions ===
async function fetchContributions() {
  const loadingEl = document.getElementById("loading");
  const table = document.getElementById("contrib-table");
  const tbody = document.getElementById("contrib-tbody");
  const dishSummaryEl = document.getElementById("dish-summary");

  loadingEl.textContent = "Chargement de la liste…";
  tbody.innerHTML = "";
  if (dishSummaryEl) dishSummaryEl.innerHTML = "";

  try {
    const res = await fetch(
      AIRTABLE_URL + "?sort[0][field]=Nom&sort[0][direction]=asc",
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Erreur API Airtable (${res.status})`);
    }

    const data = await res.json();

    if (!data.records || data.records.length === 0) {
      loadingEl.textContent =
        "Aucune contribution pour l’instant. Sois le premier à t’ajouter 😄";
      return;
    }

    const dishMap = {}; // { Plat: { count, qty } }

    data.records.forEach((record) => {
      const f = record.fields;
      const tr = document.createElement("tr");

      const nom = f["Nom"] || "";
      const type = f["Type"] || "";
      const plat = f["Plat"] || "";
      const quantite = f["Quantité"] || "";
      const acheteFlag = f["Achète"];
      const remarques = f["Allergies / Remarques"] || "";

      // Table
      const tdNom = document.createElement("td");
      tdNom.textContent = nom;
      tr.appendChild(tdNom);

      const tdType = document.createElement("td");
      tdType.textContent = type;
      tr.appendChild(tdType);

      const tdPlat = document.createElement("td");
      tdPlat.textContent = plat;
      tr.appendChild(tdPlat);

      const tdQuantite = document.createElement("td");
      tdQuantite.textContent = quantite;
      tr.appendChild(tdQuantite);

      const tdAchete = document.createElement("td");
      const achete = acheteFlag === true || acheteFlag === "Oui";
      const span = document.createElement("span");
      span.className = achete ? "tag-yes" : "tag-no";
      span.textContent = achete ? "Oui" : "Non / à voir";
      tdAchete.appendChild(span);
      tr.appendChild(tdAchete);

      const tdRemarques = document.createElement("td");
      tdRemarques.textContent = remarques;
      tr.appendChild(tdRemarques);

      tbody.appendChild(tr);

      // Récap par plat
      if (plat) {
        if (!dishMap[plat]) {
          dishMap[plat] = { count: 0, qty: 0 };
        }
        dishMap[plat].count += 1;

        const match = String(quantite).match(/(\d+([.,]\d+)?)/);
        if (match) {
          const val = parseFloat(match[1].replace(",", "."));
          if (!isNaN(val)) {
            dishMap[plat].qty += val;
          }
        }
      }
    });

    loadingEl.classList.add("hidden");
    table.classList.remove("hidden");

    // Affichage du récap par plat
    if (dishSummaryEl) {
      const entries = Object.entries(dishMap);
      entries.sort((a, b) => b[1].count - a[1].count);

      entries.forEach(([plat, info]) => {
        const li = document.createElement("li");
        if (info.qty > 0) {
          li.textContent = `${plat} : ${info.count} contribution(s), quantité ≈ ${info.qty}`;
        } else {
          li.textContent = `${plat} : ${info.count} contribution(s)`;
        }
        dishSummaryEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error(err);
    loadingEl.textContent = "Erreur lors du chargement des données 😕";
  }
}

// === Envoi d’une contribution ===
async function submitContribution(e) {
  e.preventDefault();

  const form = e.target;
  const msgEl = document.getElementById("form-message");

  const nom = form.nom.value.trim();
  let plat = form.plat.value.trim();
  const type = form.type.value;
  const quantite = form.quantite.value.trim();
  const achete = form.achete.checked;
  const remarques = form.remarques.value.trim();

  if (!nom || !plat || !type) {
    msgEl.textContent = "Merci de remplir au minimum Nom, Plat et Type 😊";
    msgEl.className = "form-message error";
    return;
  }

  if (plat === "Divers") {
    const diversVal = diversInput.value.trim();
    plat = diversVal || "Divers (non précisé)";
  }

  msgEl.textContent = "Envoi en cours…";
  msgEl.className = "form-message";

  const body = {
    records: [
      {
        fields: {
          Nom: nom,
          Plat: plat,
          Type: type,
          Quantité: quantite,
          Achète: achete,
          "Allergies / Remarques": remarques,
        },
      },
    ],
  };

  try {
    const res = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorText = "";
      try {
        const errData = await res.json();
        console.error("Erreur Airtable:", errData);
        errorText = errData.error?.message || JSON.stringify(errData);
      } catch (parseErr) {
        errorText = await res.text();
      }

      msgEl.textContent = `Erreur Airtable (${res.status}) : ${errorText}`;
      msgEl.className = "form-message error";
      return;
    }

    msgEl.textContent = "Merci ! Ta contribution a été ajoutée 🎉";
    msgEl.className = "form-message success";
    form.reset();
    diversField.style.display = "none";
    diversInput.required = false;
    diversInput.value = "";

    playClickSound(); // 🔔
    fetchContributions();
  } catch (err) {
    console.error("Erreur réseau / JS:", err);
    msgEl.textContent = "Erreur réseau ou script (regarde la console).";
    msgEl.className = "form-message error";
  }
}

// === Récupération des achats ===
async function fetchPurchases() {
  const loadingEl = document.getElementById("purchase-loading");
  const table = document.getElementById("purchase-table");
  const tbody = document.getElementById("purchase-tbody");
  const totalEl = document.getElementById("purchase-total");
  const summaryEl = document.getElementById("purchase-summary");

  loadingEl.textContent = "Chargement des achats…";
  totalEl.textContent = "";
  tbody.innerHTML = "";
  if (summaryEl) summaryEl.innerHTML = "";

  try {
    const res = await fetch(
      AIRTABLE_PURCHASE_URL + "?sort[0][field]=Nom&sort[0][direction]=asc",
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Erreur API Airtable (Achats) ${res.status}`);
    }

    const data = await res.json();

    if (!data.records || data.records.length === 0) {
      loadingEl.textContent = "Aucun achat pour l’instant.";
      table.classList.add("hidden");
      totalEl.textContent = "";
      return;
    }

    let total = 0;
    const perPerson = {};

    data.records.forEach((record) => {
      const f = record.fields;
      const tr = document.createElement("tr");

      const nom = f["Nom"] || "";
      const article = f["Article"] || "";
      const commentaire = f["Commentaire"] || "";

      const tdNom = document.createElement("td");
      tdNom.textContent = nom;
      tr.appendChild(tdNom);

      const tdArticle = document.createElement("td");
      tdArticle.textContent = article;
      tr.appendChild(tdArticle);

      const tdMontant = document.createElement("td");
      const montant =
        typeof f["Montant"] === "number"
          ? f["Montant"]
          : parseFloat(f["Montant"]);
      if (!isNaN(montant)) {
        total += montant;
        if (!perPerson[nom]) perPerson[nom] = 0;
        perPerson[nom] += montant;
      }
      tdMontant.textContent = !isNaN(montant)
        ? montant.toFixed(2)
        : "";
      tr.appendChild(tdMontant);

      const tdCommentaire = document.createElement("td");
      tdCommentaire.textContent = commentaire;
      tr.appendChild(tdCommentaire);

      tbody.appendChild(tr);
    });

    loadingEl.classList.add("hidden");
    table.classList.remove("hidden");
    totalEl.textContent = `Total dépensé : ${total.toFixed(2)} €`;

    if (summaryEl) {
      const entries = Object.entries(perPerson);
      entries.sort((a, b) => b[1] - a[1]);

      entries.forEach(([name, amount]) => {
        const li = document.createElement("li");
        li.textContent = `${name || "Non renseigné"} : ${amount.toFixed(
          2
        )} €`;
        summaryEl.appendChild(li);
      });
    }
  } catch (err) {
    console.error(err);
    loadingEl.textContent = "Erreur lors du chargement des achats 😕";
  }
}

// === Envoi d’un achat ===
async function submitPurchase(e) {
  e.preventDefault();

  const form = e.target;
  const msgEl = document.getElementById("purchase-message");

  const nom = form["achat-nom"].value.trim();
  const article = form["achat-article"].value.trim();
  const montantStr = form["achat-montant"].value.trim().replace(",", ".");
  const commentaire = form["achat-commentaire"].value.trim();

  if (!nom || !article || !montantStr) {
    msgEl.textContent = "Merci de remplir Nom, Article et Montant 😊";
    msgEl.className = "form-message error";
    return;
  }

  const montant = parseFloat(montantStr);
  if (isNaN(montant)) {
    msgEl.textContent =
      "Le montant doit être un nombre (ex : 12.50) 😉";
    msgEl.className = "form-message error";
    return;
  }

  msgEl.textContent = "Envoi de l’achat…";
  msgEl.className = "form-message";

  const body = {
    records: [
      {
        fields: {
          Nom: nom,
          Article: article,
          Montant: montant,
          Commentaire: commentaire,
        },
      },
    ],
  };

  try {
    const res = await fetch(AIRTABLE_PURCHASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errorText = "";
      try {
        const errData = await res.json();
        console.error("Erreur Airtable (Achats):", errData);
        errorText = errData.error?.message || JSON.stringify(errData);
      } catch (parseErr) {
        errorText = await res.text();
      }

      msgEl.textContent = `Erreur Airtable (Achats ${res.status}) : ${errorText}`;
      msgEl.className = "form-message error";
      return;
    }

    msgEl.textContent = "Achat ajouté, merci ! 💶";
    msgEl.className = "form-message success";
    form.reset();

    playClickSound(); // 🔔
    fetchPurchases();
  } catch (err) {
    console.error("Erreur réseau / JS:", err);
    msgEl.textContent = "Erreur réseau ou script (regarde la console).";
    msgEl.className = "form-message error";
  }
}

// === Init ===
document
  .getElementById("contrib-form")
  .addEventListener("submit", submitContribution);
document
  .getElementById("purchase-form")
  .addEventListener("submit", submitPurchase);

createSnowflakes();
updateCountdown();
fetchContributions();
fetchPurchases();

// === Mise à jour silencieuse des données toutes les 5 minutes ===
setInterval(() => {
  fetchContributions();
  fetchPurchases();
}, 5 * 60 * 1000);