// Property catalog: show cards, search and filter (Member 2)
// Used by index.html (hero search + trending row) and catalog.html (full list)

// ---------- 1. DATA ----------
// Member 4 can replace this na data ya backend 
// Keep the same fields: id, name, location, type, price, completion, image
const properties = [
  { id: 1, name: "Karen Hills Villa", location: "Karen, Nairobi", type: "villa", price: 65000000, completion: 85, image: "" },
  { id: 2, name: "Westlands Skyline", location: "Westlands, Nairobi", type: "apartment", price: 18500000, completion: 85, image: "" },
  { id: 3, name: "Runda Oasis Villa", location: "Runda, Nairobi", type: "villa", price: 85000000, completion: 92, image: "" },
  { id: 4, name: "Kilimani Azure Residences", location: "Kilimani, Nairobi", type: "apartment", price: 14500000, completion: 78, image: "" },
  { id: 5, name: "Lavington Garden Loft", location: "Lavington, Nairobi", type: "loft", price: 22000000, completion: 81, image: "" },
  { id: 6, name: "Syokimau Maple Townhouse", location: "Syokimau, Machakos", type: "townhouse", price: 9500000, completion: 74, image: "" },
  { id: 7, name: "Kileleshwa Terrace", location: "Kileleshwa, Nairobi", type: "townhouse", price: 28000000, completion: 90, image: "" },
  { id: 8, name: "Parklands Court Apartments", location: "Parklands, Nairobi", type: "apartment", price: 11500000, completion: 88, image: "" },
  { id: 9, name: "Muthaiga Heights Villa", location: "Muthaiga, Nairobi", type: "villa", price: 120000000, completion: 83, image: "" },
  { id: 10, name: "Langata Ridge Maisonette", location: "Langata, Nairobi", type: "maisonette", price: 24000000, completion: 76, image: "" },
  { id: 11, name: "Ruaka Greens Apartments", location: "Ruaka, Kiambu", type: "apartment", price: 7800000, completion: 91, image: "" },
  { id: 12, name: "Kitengela Acacia Bungalow", location: "Kitengela, Kajiado", type: "bungalow", price: 6500000, completion: 79, image: "" },
  { id: 13, name: "Athi River Sunrise Maisonette", location: "Athi River, Machakos", type: "maisonette", price: 8200000, completion: 87, image: "" },
  { id: 14, name: "Rongai Hillview Townhouse", location: "Rongai, Kajiado", type: "townhouse", price: 6900000, completion: 72, image: "" },
  { id: 15, name: "Thika Road Summit Apartments", location: "Roysambu, Nairobi", type: "apartment", price: 8900000, completion: 94, image: "" },
  { id: 16, name: "Loresho Ridge Villa", location: "Loresho, Nairobi", type: "villa", price: 55000000, completion: 80, image: "" }
];

// Nice names for the dropdown
const typeNames = {
  villa: "Villa",
  apartment: "Apartment",
  townhouse: "Townhouse",
  loft: "Loft",
  maisonette: "Maisonette",
  bungalow: "Bungalow"
};

// Small map pin icon used on every card
const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';

// ---------- 2. HELPERS ----------

// 65000000 becomes "KES 65,000,000"
function formatPrice(price) {
  return "KES " + price.toLocaleString("en-US");
}

// Builds the HTML for one property card
function makeCard(p) {
  let picture = "<span>PROJECT PREVIEW</span>";
  if (p.image !== "") {
    picture = `<img src="${p.image}" alt="${p.name}" loading="lazy">`;
  }

  return `
    <article class="property-card">
      <a class="card-link" href="property-detail.html?id=${p.id}">
        <div class="card-img">${picture}</div>
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

// Puts options inside a dropdown. "options" is a list like [{ value: "x", label: "X" }]
function fillSelect(select, firstLabel, options) {
  let html = `<option value="">${firstLabel}</option>`;
  options.forEach(function (o) {
    html += `<option value="${o.value}">${o.label}</option>`;
  });
  select.innerHTML = html;
}

// Fills the location, type and status dropdowns of a form
function fillFilters(form) {
  const locations = [];
  const types = [];

  properties.forEach(function (p) {
    if (!locations.includes(p.location)) {
      locations.push(p.location);
    }
    if (!types.includes(p.type)) {
      types.push(p.type);
    }
  });

  locations.sort();
  types.sort();

  fillSelect(form.elements.location, "All locations", locations.map(function (l) {
    return { value: l, label: l };
  }));

  fillSelect(form.elements.type, "All types", types.map(function (t) {
    return { value: t, label: typeNames[t] };
  }));

  fillSelect(form.elements.status, "Any status", [
    { value: "70", label: "70% or more" },
    { value: "80", label: "80% or more" },
    { value: "90", label: "90% or more" }
  ]);
}

// ---------- 3. HOME PAGE: search bar ----------
const heroForm = document.getElementById("hero-search");

if (heroForm) {
  fillFilters(heroForm);
}

// ---------- 4. HOME PAGE: trending row ----------
const track = document.getElementById("trending-track");

if (track) {
  // copy the list, put the most complete homes first, keep 6
  const mostComplete = [...properties].sort(function (a, b) {
    return b.completion - a.completion;
  });
  const topSix = mostComplete.slice(0, 6);

  track.innerHTML = topSix.map(makeCard).join("");

  // arrow buttons scroll the row left and right
  document.getElementById("trend-prev").addEventListener("click", function () {
    track.scrollBy({ left: -320, behavior: "smooth" });
  });
  document.getElementById("trend-next").addEventListener("click", function () {
    track.scrollBy({ left: 320, behavior: "smooth" });
  });
}

// ---------- 5. CATALOG PAGE: filters ----------
const filterForm = document.getElementById("filters");
const grid = document.getElementById("property-grid");
const resultCount = document.getElementById("results-count");

// Reads the dropdowns and shows the matching homes
function showHomes() {
  const chosenLocation = filterForm.elements.location.value;
  const chosenType = filterForm.elements.type.value;
  const chosenStatus = filterForm.elements.status.value;
  const chosenSort = filterForm.elements.sort.value;

  // keep only the homes that match every choice
  const list = properties.filter(function (p) {
    const okLocation = chosenLocation === "" || p.location === chosenLocation;
    const okType = chosenType === "" || p.type === chosenType;
    const okStatus = chosenStatus === "" || p.completion >= Number(chosenStatus);
    return okLocation && okType && okStatus;
  });

  // sort them
  if (chosenSort === "price-asc") {
    list.sort(function (a, b) { return a.price - b.price; });
  } else if (chosenSort === "price-desc") {
    list.sort(function (a, b) { return b.price - a.price; });
  } else {
    list.sort(function (a, b) { return b.completion - a.completion; });
  }

  // show how many were found
  if (list.length === 1) {
    resultCount.textContent = "1 home found";
  } else {
    resultCount.textContent = list.length + " homes found";
  }

  // show the cards, or a message if there are none
  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <p>No homes match these filters. Try a lower completion level or a different place.</p>
        <button type="button" class="btn btn-dark" id="clear-filters">Clear filters</button>
      </div>
    `;
  } else {
    grid.innerHTML = list.map(makeCard).join("");
  }
}

if (filterForm && grid) {
  fillFilters(filterForm);

  // Prefill from the address, for example catalog.html?location=Karen%2C%20Nairobi&status=80
  const params = new URLSearchParams(window.location.search);
  ["location", "type", "status", "sort"].forEach(function (name) {
    const value = params.get(name);
    if (value) {
      filterForm.elements[name].value = value;
    }
  });

  // update the list whenever a dropdown changes
  filterForm.addEventListener("change", showHomes);

  filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
    showHomes();
  });

  // the "Clear filters" button
  grid.addEventListener("click", function (event) {
    if (event.target.id === "clear-filters") {
      filterForm.reset();
      showHomes();
    }
  });

  showHomes();
}