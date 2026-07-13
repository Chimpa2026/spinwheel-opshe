(function () {
  const list = document.getElementById("prize-list");
  const addBtn = document.getElementById("add-prize-btn");
  const countLabel = document.getElementById("prize-count");
  const MIN = window.MIN_PRIZES || 2;
  const MAX = window.MAX_PRIZES || 10;
  const COLORS = window.WHEEL_COLORS || [];
  let prizes = (window.INITIAL_PRIZES || []).slice();

  if (prizes.length < MIN) {
    while (prizes.length < MIN) prizes.push("");
  }

  function updateCount() {
    countLabel.textContent = `(${list.children.length}/${MAX})`;
    addBtn.disabled = list.children.length >= MAX;
    addBtn.style.opacity = addBtn.disabled ? 0.5 : 1;
    addBtn.style.cursor = addBtn.disabled ? "not-allowed" : "pointer";

    const removeBtns = list.querySelectorAll(".prize-remove");
    removeBtns.forEach((btn) => {
      btn.style.visibility = list.children.length <= MIN ? "hidden" : "visible";
    });
  }

  function addRow(value) {
    if (list.children.length >= MAX) return;
    const idx = list.children.length;
    const row = document.createElement("div");
    row.className = "prize-row";
    row.innerHTML = `
      <span class="swatch" style="background:${COLORS[idx % COLORS.length]};"></span>
      <input type="text" name="prizes[]" maxlength="20" placeholder="Nama hadiah panel ${idx + 1}" value="${value ? value.replace(/"/g, '&quot;') : ""}" required>
      <button type="button" class="prize-remove" title="Hapus panel ini">&times;</button>
    `;
    row.querySelector(".prize-remove").addEventListener("click", () => {
      row.remove();
      reindex();
    });
    list.appendChild(row);
    updateCount();
  }

  function reindex() {
    Array.from(list.children).forEach((row, idx) => {
      const swatch = row.querySelector(".swatch");
      const input = row.querySelector("input");
      swatch.style.background = COLORS[idx % COLORS.length];
      input.placeholder = `Nama hadiah panel ${idx + 1}`;
    });
    updateCount();
  }

  prizes.forEach((p) => addRow(p));

  addBtn.addEventListener("click", () => {
    addRow("");
  });

  // ---------- Preview logo ----------
  const logoInput = document.getElementById("logo");
  const logoPreview = document.getElementById("logo-preview");
  const logoFilename = document.getElementById("logo-filename");

  if (logoInput) {
    logoInput.addEventListener("change", () => {
      const file = logoInput.files[0];
      if (!file) return;
      logoFilename.textContent = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        logoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview logo">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Validasi sebelum submit ----------
  document.getElementById("wheel-form").addEventListener("submit", (e) => {
    const filled = Array.from(list.querySelectorAll('input[name="prizes[]"]')).filter(i => i.value.trim());
    if (filled.length < MIN) {
      e.preventDefault();
      alert(`Minimal ${MIN} panel hadiah harus diisi.`);
    }
  });
})();
