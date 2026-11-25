// Property catalog: show cards, search and filter
// Used by index.html (hero search + trending row) and catalog.html (full list)

const defaultImages = {
  villa: "assets/Images/villa.jpg",
  apartment: "assets/Images/aptblck.jpg",
  townhouse: "assets/Images/twnhse.jpg",
  loft: "assets/Images/loft.jpg",
  maisonette: "assets/Images/msnt.jpg",
  bungalow: "assets/Images/bnglw.jpg"
};

// ---------- 1. DATA ----------
let properties = [
  { id: 1, name: "Karen Hills Villa", location: "Karen, Nairobi", type: "villa", price: 65000000, completion: 85, image: "assets/Images/villa.jpg" },
  { id: 2, name: "Westlands Skyline", location: "Westlands, Nairobi", type: "apartment", price: 18500000, completion: 85, image: "assets/Images/aptblck.jpg" },
  { id: 3, name: "Runda Oasis Villa", location: "Runda, Nairobi", type: "villa", price: 85000000, completion: 92, image: "assets/Images/villa2.jpg" },
  { id: 4, name: "Kilimani Azure Residences", location: "Kilimani, Nairobi", type: "apartment", price: 14500000, completion: 78, image: "assets/Images/aptblck2.jpg" },
  { id: 5, name: "Lavington Garden Loft", location: "Lavington, Nairobi", type: "loft", price: 22000000, completion: 81, image: "assets/Images/loft.jpg" },
  { id: 6, name: "Syokimau Maple Townhouse", location: "Syokimau, Machakos", type: "townhouse", price: 9500000, completion: 74, image: "assets/Images/twnhse.jpg" },
  { id: 7, name: "Kileleshwa Terrace", location: "Kileleshwa, Nairobi", type: "townhouse", price: 28000000, completion: 90, image: "assets/Images/twnhse2.jpg" },
  { id: 8, name: "Parklands Court Apartments", location: "Parklands, Nairobi", type: "apartment", price: 11500000, completion: 88, image: "assets/Images/aptblck3.jpg" },
  { id: 9, name: "Muthaiga Heights Villa", location: "Muthaiga, Nairobi", type: "villa", price: 120000000, completion: 83, image: "assets/Images/villa3.jpg" },
  { id: 10, name: "Langata Ridge Maisonette", location: "Langata, Nairobi", type: "maisonette", price: 24000000, completion: 76, image: "assets/Images/msnt.jpg" },
  { id: 11, name: "Ruaka Greens Apartments", location: "Ruaka, Kiambu", type: "apartment", price: 7800000, completion: 91, image: "assets/Images/aptblck.jpg" },
  { id: 12, name: "Kitengela Acacia Bungalow", location: "Kitengela, Kajiado", type: "bungalow", price: 6500000, completion: 79, image: "assets/Images/bnglw.jpg" },
  { id: 13, name: "Athi River Sunrise Maisonette", location: "Athi River, Machakos", type: "maisonette", price: 8200000, completion: 87, image: "assets/Images/msnt.jpg" },
  { id: 14, name: "Rongai Hillview Townhouse", location: "Rongai, Kajiado", type: "townhouse", price: 6900000, completion: 72, image: "assets/Images/twnhse3.jpg" },
  { id: 15, name: "Thika Road Summit Apartments", location: "Roysambu, Nairobi", type: "apartment", price: 8900000, completion: 94, image: "assets/Images/aptblck2.jpg" },
  { id: 16, name: "Loresho Ridge Villa", location: "Loresho, Nairobi", type: "villa", price: 55000000, completion: 80, image: "assets/Images/villa.jpg" }
];

const typeNames = {
  villa: "Villa",
  apartment: "Apartment",
  townhouse: "Townhouse",
  loft: "Loft",
  maisonette: "Maisonette",
  bungalow: "Bungalow"
};

const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

// ---------- 2. HELPERS ----------
function formatPrice(price) {
  return "KES " + Number(price).toLocaleString("en-US");
}

function makeCard(p) {
  const imgSrc = p.image || defaultImages[p.type] || "assets/Images/villa.jpg";
  return `
    <article class="property-card">
      <a class="card-link" href="property-detail.html?id=${p.id}">
        <div class="card-img"><img src="${imgSrc}" alt="${p.name}" loading="lazy"></div>
        <div class="card-body">
          <div class="card-top">
            <h3>${p.name}</h3>
            <span class="badge">${p.completion}% Complete</span>
          </div>
          <p class="card-loc">${pinIcon}${p.location}</p>
          <div class="card-foot">
            <strong>${formatPrice(p.price)}</strong>
            <span>View Details</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function fillSelect(select, firstLabel, options) {
  if (!select) return;
  let html = `<option value="">${firstLabel}</option>`;
  options.forEach(function (o) {
    html += `<option value="${o.value}">${o.label}</option>`;
  });
  select.innerHTML = html;
}

function fillFilters(form) {
  const locations = [];
  const types = [];

  properties.forEach(function (p) {
    if (p.location && !locations.includes(p.location)) locations.push(p.location);
    if (p.type && !types.includes(p.type)) types.push(p.type);
  });

  locations.sort();
  types.sort();

  fillSelect(form.elements.location, "All locations", locations.map(l => ({ value: l, label: l })));
  fillSelect(form.elements.type, "All types", types.map(t => ({ value: t, label: typeNames[t] || t })));
  fillSelect(form.elements.status, "Any status", [
    { value: "70", label: "70% or more" },
    { value: "80", label: "80% or more" },
    { value: "90", label: "90% or more" }
  ]);
}

// ---------- 3. HOME PAGE ----------
const heroForm = document.getElementById("hero-search");
const track = document.getElementById("trending-track");

function initHomePage() {
  if (heroForm) fillFilters(heroForm);

  if (track) {
    const topSix = [...properties].sort((a, b) => b.completion - a.completion).slice(0, 6);
    track.innerHTML = topSix.map(makeCard).join("");
  }
}

if (track) {
  document.getElementById("trend-prev")?.addEventListener("click", () => track.scrollBy({ left: -320, behavior: "smooth" }));
  document.getElementById("trend-next")?.addEventListener("click", () => track.scrollBy({ left: 320, behavior: "smooth" }));
}

// ---------- 4. CATALOG PAGE ----------
const filterForm = document.getElementById("filters");
const grid = document.getElementById("property-grid");
const resultCount = document.getElementById("results-count");

function showHomes() {
  if (!filterForm || !grid) return;

  const chosenLocation = filterForm.elements.location.value;
  const chosenType = filterForm.elements.type.value;
  const chosenStatus = filterForm.elements.status.value;
  const chosenSort = filterForm.elements.sort.value;

  const list = properties.filter(p =>
    (chosenLocation === "" || p.location === chosenLocation) &&
    (chosenType === "" || p.type === chosenType) &&
    (chosenStatus === "" || p.completion >= Number(chosenStatus))
  );

  if (chosenSort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (chosenSort === "price-desc") list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => b.completion - a.completion);

  if (resultCount) {
    resultCount.textContent = list.length === 1 ? "1 home found" : list.length + " homes found";
  }

  grid.innerHTML = list.length === 0
    ? `<div class="empty"><p>No homes match these filters. Try a lower completion level or a different place.</p><button type="button" class="btn btn-dark" id="clear-filters">Clear filters</button></div>`
    : list.map(makeCard).join("");
}

function initCatalogPage() {
  if (!filterForm || !grid) return;
  fillFilters(filterForm);

  const params = new URLSearchParams(window.location.search);
  ["location", "type", "status", "sort"].forEach(name => {
    const value = params.get(name);
    if (value && filterForm.elements[name]) filterForm.elements[name].value = value;
  });

  showHomes();
}

if (filterForm && grid) {
  filterForm.addEventListener("change", showHomes);
  filterForm.addEventListener("submit", e => { e.preventDefault(); showHomes(); });
  grid.addEventListener("click", e => {
    if (e.target.id === "clear-filters") {
      filterForm.reset();
      showHomes();
    }
  });
}

// ---------- 5. LOAD FROM BACKEND API (WITH LOCAL FALLBACK) ----------
async function loadProperties() {
  initHomePage();
  initCatalogPage();

  try {
    const response = await fetch("/api/properties");
    if (!response.ok) return;

    const data = await response.json();
    if (Array.isArray(data.properties) && data.properties.length > 0) {
      properties = data.properties.map(p => ({
        id: p.id,
        name: p.title,
        location: p.location,
        type: p.property_type || "apartment",
        price: Number(p.price),
        completion: p.completion_percentage,
        image: p.image_url || defaultImages[p.property_type] || "assets/Images/villa.jpg"
      }));
      initHomePage();
      initCatalogPage();
    }
  } catch (err) {
    // Offline or server not started: local properties with photos remain active
  }
}

loadProperties();