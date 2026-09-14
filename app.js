(() => {
  "use strict";

  const STORAGE_KEY = "gilvarryWallCalendarV1";
  const LEGACY_KEY = "wallCalendarAllInOneV1";
  const PERTH_ZONE = "Australia/Perth";
  const DEFAULT_WEATHER = { name: "Perth", admin: "Western Australia", country: "Australia", latitude: -31.9523, longitude: 115.8613, timezone: "Australia/Perth" };
  const categoryIcons = {
    family: "users-round",
    health: "stethoscope",
    home: "house",
    shopping: "shopping-cart",
    birthday: "cake-slice",
    outing: "plane",
  };

  const defaultState = () => ({
    activeMember: "Karl",
    calendarView: "month",
    use24Hour: false,
    weather: { ...DEFAULT_WEATHER },
    events: [
      { id: "sample-1", title: "Doctor", date: "2026-09-01", time: "10:00", member: "Mum", category: "health", details: "Annual check-up" },
      { id: "sample-2", title: "Physio", date: "2026-09-03", time: "11:00", member: "Dad", category: "health", details: "1 hour" },
      { id: "sample-3", title: "Groceries", date: "2026-09-06", time: "09:00", member: "Everyone", category: "shopping", details: "Weekly shop" },
      { id: "sample-4", title: "Bin day", date: "2026-09-08", time: "", member: "Everyone", category: "home", details: "Put bins out tonight" },
      { id: "sample-5", title: "Home Maintenance", date: "2026-09-10", time: "14:00", member: "Dad", category: "home", details: "Check the reticulation" },
      { id: "sample-6", title: "Gym", date: "2026-09-14", time: "08:00", member: "Karl", category: "health", details: "1 hour" },
      { id: "sample-7", title: "Dinner with Mum & Dad", date: "2026-09-14", time: "18:00", member: "Everyone", category: "family", details: "At home" },
      { id: "sample-8", title: "Birthday Lunch", date: "2026-09-18", time: "12:00", member: "Mum", category: "birthday", details: "Bring a card" },
      { id: "sample-9", title: "Car Service", date: "2026-09-24", time: "09:00", member: "Dad", category: "home", details: "Drop off before work" },
      { id: "sample-10", title: "Family Day Out", date: "2026-09-26", time: "10:00", member: "Everyone", category: "outing", details: "Pack hats and water" },
      { id: "sample-11", title: "Pay Bills", date: "2026-09-30", time: "09:00", member: "Karl", category: "home", details: "Electricity and internet" },
    ],
    tasks: [
      { id: "task-1", text: "Call about NBN", owner: "Karl", done: false },
      { id: "task-2", text: "Check car rego", owner: "Dad", done: false },
      { id: "task-3", text: "Plan Brisbane trip", owner: "Everyone", done: false },
      { id: "task-4", text: "Water the garden", owner: "Mum", done: true },
    ],
    shopping: [
      { id: "shop-1", text: "Milk", owner: "Everyone", done: false },
      { id: "shop-2", text: "Bread", owner: "Everyone", done: false },
      { id: "shop-3", text: "Fruit & Veg", owner: "Mum", done: false },
      { id: "shop-4", text: "Chicken", owner: "Dad", done: false },
      { id: "shop-5", text: "Toilet paper", owner: "Karl", done: false },
    ],
    notes: [
      { id: "note-1", text: "Look at a new fridge", owner: "Everyone", created: "14 Sep" },
      { id: "note-2", text: "Remember Nan’s birthday present this weekend.", owner: "Mum", created: "12 Sep" },
    ],
    photos: [],
  });

  const dom = {};
  let state = loadState();
  let selectedKey = perthDateKey();
  let viewDate = parseDateKey(selectedKey);
  let toastTimer = null;

  function byId(id) { return document.getElementById(id); }
  function uid(prefix) {
    if (crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function safeArray(value) { return Array.isArray(value) ? value : []; }

  function normalizeState(candidate) {
    const fallback = defaultState();
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return fallback;
    return {
      activeMember: ["Karl", "Mum", "Dad"].includes(candidate.activeMember) ? candidate.activeMember : fallback.activeMember,
      calendarView: ["month", "week", "day"].includes(candidate.calendarView) ? candidate.calendarView : fallback.calendarView,
      use24Hour: Boolean(candidate.use24Hour),
      weather: normalizeWeather(candidate.weather),
      events: safeArray(candidate.events).filter(item => item && item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.date)).map(item => ({
        id: String(item.id || uid("event")), title: String(item.title).slice(0, 80), date: item.date,
        time: /^\d{2}:\d{2}$/.test(item.time || "") ? item.time : "", member: String(item.member || "Everyone").slice(0, 20),
        category: categoryIcons[item.category] ? item.category : "family", details: String(item.details || "").slice(0, 160),
      })),
      tasks: normalizeList(candidate.tasks, "task"),
      shopping: normalizeList(candidate.shopping, "shop"),
      notes: safeArray(candidate.notes).filter(item => item && item.text).map(item => ({ id: String(item.id || uid("note")), text: String(item.text).slice(0, 120), owner: String(item.owner || "Everyone").slice(0, 20), created: String(item.created || "Today").slice(0, 20) })),
      photos: safeArray(candidate.photos).filter(photo => typeof photo === "string" && photo.startsWith("data:image/")).slice(-24),
    };
  }

  function normalizeList(list, prefix) {
    return safeArray(list).filter(item => item && item.text).map(item => ({ id: String(item.id || uid(prefix)), text: String(item.text).slice(0, 120), owner: String(item.owner || "Everyone").slice(0, 20), done: Boolean(item.done) }));
  }

  function normalizeWeather(weather) {
    if (!weather || typeof weather !== "object") return { ...DEFAULT_WEATHER };
    const latitude = Number(weather.latitude);
    const longitude = Number(weather.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return { ...DEFAULT_WEATHER };
    return {
      name: String(weather.name || "Current location").slice(0, 60),
      admin: String(weather.admin || "").slice(0, 80),
      country: String(weather.country || "").slice(0, 80),
      latitude,
      longitude,
      timezone: String(weather.timezone || "auto").slice(0, 80),
    };
  }

  function migrateLegacy() {
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
      if (!legacy || typeof legacy !== "object") return null;
      const next = defaultState();
      next.tasks = normalizeList(legacy.todo, "task");
      next.shopping = normalizeList(legacy.shopping, "shop");
      next.notes = legacy.notes ? [{ id: uid("note"), text: String(legacy.notes).slice(0, 120), owner: "Everyone", created: "Imported" }] : next.notes;
      next.photos = safeArray(legacy.photos).filter(photo => typeof photo === "string" && photo.startsWith("data:image/")).slice(-24);
      Object.entries(legacy.events || {}).forEach(([date, events]) => {
        safeArray(events).forEach(event => next.events.push({ id: uid("event"), title: String(event.text || "Event").slice(0, 80), date, time: event.time || "", member: "Everyone", category: "family", details: "Imported from the previous calendar" }));
      });
      return next;
    } catch { return null; }
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return normalizeState(saved || migrateLegacy() || defaultState());
    } catch { return defaultState(); }
  }

  function persist(message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (message) showToast(message);
      return true;
    } catch {
      showToast("This device is out of storage. Remove a photo and try again.", true);
      return false;
    }
  }

  function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function perthDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: PERTH_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const part = type => parts.find(item => item.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }
  function startOfWeek(date) {
    const copy = new Date(date);
    const offset = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - offset);
    copy.setHours(12, 0, 0, 0);
    return copy;
  }
  function addDays(date, count) { const copy = new Date(date); copy.setDate(copy.getDate() + count); return copy; }
  function formatDate(date, options) { return new Intl.DateTimeFormat("en-AU", options).format(date); }
  function formatTime(time) {
    if (!time) return "All day";
    if (state.use24Hour) return time;
    const [hours, minutes] = time.split(":").map(Number);
    return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(2000, 0, 1, hours, minutes));
  }
  function eventSort(a, b) { return (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title); }
  function eventsFor(key) { return state.events.filter(event => event.date === key).sort(eventSort); }

  function cacheDom() {
    ["clock", "fullDate", "weatherTemp", "weatherText", "weatherLocationName", "weatherCurrentIcon", "weatherHumidity", "weatherWind", "weatherSettingSummary", "forecast", "periodTitle", "calendarView", "agendaHeading", "agendaDate", "agendaList", "shoppingMiniList", "notesMiniList", "taskBadge", "shopBadge", "taskManagerList", "shoppingManagerList", "notesBoard", "photoGrid", "taskProgressLabel", "taskProgressBar", "eventModal", "eventForm", "quickModal", "quickForm", "weatherModal", "weatherSearchForm", "weatherSearchResults", "weatherSearchStatus", "toast"].forEach(id => dom[id] = byId(id));
  }

  function makeIcon(name) {
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", name);
    return icon;
  }
  function refreshIcons(root = document) { if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" }, root }); }

  function updateClock() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-AU", { timeZone: PERTH_ZONE, hour: "numeric", minute: "2-digit", hour12: !state.use24Hour }).formatToParts(now);
    const hour = parts.find(part => part.type === "hour")?.value || "";
    const minute = parts.find(part => part.type === "minute")?.value || "";
    const dayPeriod = parts.find(part => part.type === "dayPeriod")?.value || "";
    dom.clock.innerHTML = `${hour}:${minute}${dayPeriod ? ` <span>${dayPeriod}</span>` : ""}`;
    dom.fullDate.textContent = new Intl.DateTimeFormat("en-AU", { timeZone: PERTH_ZONE, weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(now);
  }

  function renderAll() {
    renderMember();
    renderCalendar();
    renderAgenda();
    renderMiniLists();
    renderManagers();
    renderNotes();
    renderPhotos();
    updateSettings();
    refreshIcons();
  }

  function renderMember() {
    document.querySelectorAll(".member").forEach(button => button.classList.toggle("active", button.dataset.member === state.activeMember));
    byId("eventMember").value = state.activeMember;
  }

  function renderCalendar() {
    document.querySelectorAll("[data-calendar-view]").forEach(button => button.classList.toggle("active", button.dataset.calendarView === state.calendarView));
    if (state.calendarView === "month") renderMonth();
    else if (state.calendarView === "week") renderWeek();
    else renderDay();
  }

  function renderMonth() {
    dom.periodTitle.textContent = formatDate(viewDate, { month: "long", year: "numeric" });
    byId("previousPeriod").setAttribute("aria-label", "Previous month");
    byId("nextPeriod").setAttribute("aria-label", "Next month");
    const grid = document.createElement("div");
    grid.className = "month-grid";
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(day => {
      const heading = document.createElement("div"); heading.className = "weekday"; heading.textContent = day; grid.append(heading);
    });
    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 12);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    for (let index = 0; index < 42; index += 1) {
      const current = addDays(start, index);
      grid.append(createDayCell(current));
    }
    dom.calendarView.replaceChildren(grid);
    refreshIcons(grid);
  }

  function createDayCell(date) {
    const key = dateKey(date);
    const events = eventsFor(key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-cell";
    if (date.getMonth() !== viewDate.getMonth()) button.classList.add("outside");
    if (key === perthDateKey()) button.classList.add("today");
    if (key === selectedKey) button.classList.add("selected");
    button.setAttribute("aria-label", `${formatDate(date, { weekday: "long", day: "numeric", month: "long" })}${events.length ? `, ${events.length} event${events.length === 1 ? "" : "s"}` : ""}`);
    button.addEventListener("click", () => { selectedKey = key; renderCalendar(); renderAgenda(); });
    button.addEventListener("dblclick", () => openEventModal(key));
    const number = document.createElement("span"); number.className = "day-number"; number.textContent = date.getDate(); button.append(number);
    events.slice(0, 2).forEach(event => button.append(createEventChip(event)));
    if (events.length > 2) { const more = document.createElement("span"); more.className = "more-events"; more.textContent = `+${events.length - 2} more`; button.append(more); }
    return button;
  }

  function createEventChip(event) {
    const chip = document.createElement("span"); chip.className = `event-chip ${event.category}`;
    chip.append(makeIcon(categoryIcons[event.category] || "calendar"));
    const title = document.createElement("strong"); title.textContent = `${event.member === "Everyone" ? "" : `${event.member} · `}${event.title}`; chip.append(title);
    const time = document.createElement("small"); time.textContent = formatTime(event.time); chip.append(time);
    return chip;
  }

  function renderWeek() {
    const selected = parseDateKey(selectedKey);
    const start = startOfWeek(selected);
    const end = addDays(start, 6);
    dom.periodTitle.textContent = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
    byId("previousPeriod").setAttribute("aria-label", "Previous week");
    byId("nextPeriod").setAttribute("aria-label", "Next week");
    const grid = document.createElement("div"); grid.className = "week-view";
    for (let index = 0; index < 7; index += 1) {
      const date = addDays(start, index); const key = dateKey(date); const column = document.createElement("section"); column.className = "week-day";
      if (key === perthDateKey()) column.classList.add("today");
      const header = document.createElement("button"); header.type = "button"; header.className = "week-day-header"; header.innerHTML = `<span>${formatDate(date, { weekday: "short" })}</span><strong>${date.getDate()}</strong>`;
      header.addEventListener("click", () => { selectedKey = key; state.calendarView = "day"; persist(); renderCalendar(); renderAgenda(); });
      const eventList = document.createElement("div"); eventList.className = "week-events";
      const events = eventsFor(key);
      if (!events.length) { const empty = document.createElement("p"); empty.className = "empty-day"; empty.textContent = "No plans"; eventList.append(empty); }
      events.forEach(event => { const item = document.createElement("button"); item.type = "button"; item.className = "week-event"; item.innerHTML = `<b></b><span></span>`; item.querySelector("b").textContent = event.title; item.querySelector("span").textContent = formatTime(event.time); item.addEventListener("click", () => openEventModal(key, event.id)); eventList.append(item); });
      column.append(header, eventList); grid.append(column);
    }
    dom.calendarView.replaceChildren(grid);
  }

  function renderDay() {
    const date = parseDateKey(selectedKey);
    dom.periodTitle.textContent = formatDate(date, { weekday: "long", day: "numeric", month: "long" });
    byId("previousPeriod").setAttribute("aria-label", "Previous day");
    byId("nextPeriod").setAttribute("aria-label", "Next day");
    const view = document.createElement("div"); view.className = "day-view";
    const heading = document.createElement("div"); heading.className = "day-view-heading";
    const orb = document.createElement("div"); orb.className = "date-orb"; orb.textContent = date.getDate();
    const copy = document.createElement("div"); const title = document.createElement("h3"); title.textContent = keyIsToday(selectedKey) ? "Today at a glance" : formatDate(date, { weekday: "long" }); const sub = document.createElement("p"); sub.textContent = `${eventsFor(selectedKey).length} planned item${eventsFor(selectedKey).length === 1 ? "" : "s"} for the family`; copy.append(title, sub); heading.append(orb, copy); view.append(heading);
    const events = eventsFor(selectedKey);
    if (!events.length) {
      const empty = document.createElement("div"); empty.className = "empty-state"; empty.append(makeIcon("calendar-heart")); const h = document.createElement("h3"); h.textContent = "A clear day"; const p = document.createElement("p"); p.textContent = "Double-click a date or use Add Event when plans come up."; empty.append(h, p); view.append(empty);
    } else {
      const timeline = document.createElement("div"); timeline.className = "timeline";
      events.forEach(event => { const item = document.createElement("div"); item.className = "timeline-item"; const time = document.createElement("div"); time.className = "timeline-time"; time.textContent = formatTime(event.time); const card = document.createElement("button"); card.type = "button"; card.className = "timeline-card"; const b = document.createElement("b"); b.textContent = event.title; const s = document.createElement("span"); s.textContent = `${event.member}${event.details ? ` · ${event.details}` : ""}`; card.append(b, s); card.addEventListener("click", () => openEventModal(selectedKey, event.id)); item.append(time, card); timeline.append(item); });
      view.append(timeline);
    }
    dom.calendarView.replaceChildren(view);
    refreshIcons(view);
  }

  function keyIsToday(key) { return key === perthDateKey(); }

  function renderAgenda() {
    const date = parseDateKey(selectedKey);
    dom.agendaHeading.textContent = keyIsToday(selectedKey) ? "Today" : formatDate(date, { weekday: "long" });
    dom.agendaDate.textContent = formatDate(date, { weekday: "short", day: "numeric", month: "long" });
    dom.agendaList.replaceChildren();
    const events = eventsFor(selectedKey);
    if (!events.length) { const empty = document.createElement("div"); empty.className = "empty-state"; empty.style.minHeight = "118px"; const p = document.createElement("p"); p.textContent = "Nothing planned yet."; empty.append(p); dom.agendaList.append(empty); return; }
    events.slice(0, 4).forEach(event => {
      const button = document.createElement("button"); button.type = "button"; button.className = "agenda-item"; button.style.width = "100%"; button.style.borderLeft = "0"; button.style.borderRight = "0"; button.style.borderTop = "0"; button.addEventListener("click", () => openEventModal(selectedKey, event.id));
      const time = document.createElement("span"); time.className = "agenda-time"; time.textContent = formatTime(event.time);
      const icon = document.createElement("span"); icon.className = "agenda-icon"; icon.append(makeIcon(categoryIcons[event.category] || "calendar"));
      const copy = document.createElement("span"); copy.className = "agenda-copy"; const name = document.createElement("b"); name.textContent = event.title; const details = document.createElement("small"); details.textContent = event.details || event.member; copy.append(name, details);
      button.append(time, icon, copy); dom.agendaList.append(button);
    });
    refreshIcons(dom.agendaList);
  }

  function createCheckRow(item, type, compact = false) {
    const label = document.createElement("label"); label.className = "check-row";
    const input = document.createElement("input"); input.type = "checkbox"; input.checked = item.done; input.addEventListener("change", () => toggleListItem(type, item.id));
    const box = document.createElement("span"); box.className = "custom-check";
    const text = document.createElement("span"); text.textContent = item.text;
    label.append(input, box, text);
    if (compact) return label;
    const row = document.createElement("div"); row.className = `manager-row${item.done ? " done" : ""}`;
    const copy = document.createElement("div"); copy.className = "manager-copy"; const title = document.createElement("b"); title.textContent = item.text; const subtitle = document.createElement("small"); subtitle.textContent = item.done ? "Completed" : "Still to do"; copy.append(title, subtitle);
    const owner = document.createElement("span"); owner.className = "owner-pill"; owner.textContent = item.owner;
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete-button"; remove.setAttribute("aria-label", `Delete ${item.text}`); remove.append(makeIcon("trash-2")); remove.addEventListener("click", () => deleteListItem(type, item.id));
    const control = document.createElement("label"); control.className = "check-row"; control.setAttribute("aria-label", `${item.done ? "Mark incomplete" : "Mark complete"}: ${item.text}`); control.append(input, box);
    row.append(control, copy, owner, remove);
    return row;
  }

  function renderMiniLists() {
    dom.shoppingMiniList.replaceChildren();
    state.shopping.slice(0, 6).forEach(item => dom.shoppingMiniList.append(createCheckRow(item, "shopping", true)));
    if (!state.shopping.length) { const empty = document.createElement("div"); empty.className = "mini-empty"; empty.textContent = "The list is empty."; dom.shoppingMiniList.append(empty); }
    dom.notesMiniList.replaceChildren();
    state.notes.slice(0, 4).forEach(note => { const row = document.createElement("div"); row.className = "check-row"; const box = document.createElement("span"); box.className = "custom-check"; const text = document.createElement("span"); text.textContent = note.text; row.append(box, text); dom.notesMiniList.append(row); });
    if (!state.notes.length) { const empty = document.createElement("div"); empty.className = "mini-empty"; empty.textContent = "No notes yet."; dom.notesMiniList.append(empty); }
    const taskCount = state.tasks.filter(item => !item.done).length;
    const shopCount = state.shopping.filter(item => !item.done).length;
    dom.taskBadge.textContent = taskCount; dom.taskBadge.dataset.count = taskCount;
    dom.shopBadge.textContent = shopCount; dom.shopBadge.dataset.count = shopCount;
  }

  function renderManagers() {
    dom.taskManagerList.replaceChildren(); dom.shoppingManagerList.replaceChildren();
    state.tasks.forEach(item => dom.taskManagerList.append(createCheckRow(item, "tasks")));
    state.shopping.forEach(item => dom.shoppingManagerList.append(createCheckRow(item, "shopping")));
    if (!state.tasks.length) dom.taskManagerList.append(managerEmpty("No tasks yet. Add one for the family."));
    if (!state.shopping.length) dom.shoppingManagerList.append(managerEmpty("The shopping list is empty."));
    const completed = state.tasks.filter(item => item.done).length;
    const total = state.tasks.length;
    dom.taskProgressLabel.textContent = `${completed} of ${total} complete`;
    dom.taskProgressBar.style.width = `${total ? Math.round((completed / total) * 100) : 0}%`;
    refreshIcons(dom.taskManagerList); refreshIcons(dom.shoppingManagerList);
  }

  function managerEmpty(text) { const empty = document.createElement("div"); empty.className = "empty-state"; const p = document.createElement("p"); p.textContent = text; empty.append(p); return empty; }

  function renderNotes() {
    dom.notesBoard.replaceChildren();
    if (!state.notes.length) { dom.notesBoard.append(managerEmpty("No notes yet. Add a reminder for everyone.")); return; }
    state.notes.forEach(note => {
      const card = document.createElement("article"); card.className = "note-card"; const text = document.createElement("p"); text.textContent = note.text; const meta = document.createElement("small"); meta.textContent = `${note.owner} · ${note.created}`;
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete-button"; remove.setAttribute("aria-label", "Delete note"); remove.append(makeIcon("trash-2")); remove.addEventListener("click", () => { state.notes = state.notes.filter(item => item.id !== note.id); persist("Note removed"); renderAll(); });
      card.append(remove, text, meta); dom.notesBoard.append(card);
    });
    refreshIcons(dom.notesBoard);
  }

  function renderPhotos() {
    dom.photoGrid.replaceChildren();
    if (!state.photos.length) {
      const empty = document.createElement("div"); empty.className = "photo-empty"; const wrap = document.createElement("div"); wrap.append(makeIcon("images")); const title = document.createElement("h3"); title.textContent = "Your family gallery starts here"; const p = document.createElement("p"); p.textContent = "Add photos from this device. They stay in this browser."; wrap.append(title, p); empty.append(wrap); dom.photoGrid.append(empty); refreshIcons(empty); return;
    }
    state.photos.forEach((photo, index) => {
      const card = document.createElement("div"); card.className = "photo-card"; const image = document.createElement("img"); image.src = photo; image.alt = `Family photo ${index + 1}`;
      const remove = document.createElement("button"); remove.type = "button"; remove.className = "delete-button"; remove.setAttribute("aria-label", `Delete family photo ${index + 1}`); remove.append(makeIcon("trash-2")); remove.addEventListener("click", () => { state.photos.splice(index, 1); persist("Photo removed"); renderPhotos(); });
      card.append(image, remove); dom.photoGrid.append(card);
    });
    refreshIcons(dom.photoGrid);
  }

  function updateSettings() {
    const toggle = byId("timeFormatToggle"); toggle.setAttribute("aria-checked", String(state.use24Hour));
    dom.weatherLocationName.textContent = state.weather.name;
    const details = [state.weather.admin, state.weather.country].filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(", ");
    dom.weatherSettingSummary.textContent = `${state.weather.name}${details ? `, ${details}` : ""} · Refreshes every 30 minutes.`;
    byId("weatherWidget").setAttribute("aria-label", `${state.weather.name} weather`);
  }

  function toggleListItem(type, id) {
    const item = state[type].find(entry => entry.id === id); if (!item) return; item.done = !item.done; persist(); renderMiniLists(); renderManagers(); refreshIcons();
  }
  function deleteListItem(type, id) { state[type] = state[type].filter(item => item.id !== id); persist("Item removed"); renderMiniLists(); renderManagers(); }

  function showSection(section) {
    document.querySelectorAll(".section-panel").forEach(panel => panel.classList.remove("active"));
    const target = byId(`${section}Section`) || byId("calendarSection"); target.classList.add("active");
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.section === section));
    if (window.innerWidth < 760) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function shiftPeriod(direction) {
    if (state.calendarView === "month") {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1, 12);
      selectedKey = dateKey(viewDate);
    } else if (state.calendarView === "week") selectedKey = dateKey(addDays(parseDateKey(selectedKey), direction * 7));
    else selectedKey = dateKey(addDays(parseDateKey(selectedKey), direction));
    if (state.calendarView !== "month") viewDate = parseDateKey(selectedKey);
    renderCalendar(); renderAgenda();
  }

  function goToday() { selectedKey = perthDateKey(); viewDate = parseDateKey(selectedKey); renderCalendar(); renderAgenda(); }

  function openEventModal(key = selectedKey, eventId = "") {
    const event = state.events.find(item => item.id === eventId);
    byId("eventModalTitle").textContent = event ? "Edit event" : "Add an event";
    byId("eventId").value = event?.id || "";
    byId("eventTitle").value = event?.title || "";
    byId("eventDate").value = event?.date || key;
    byId("eventTime").value = event?.time || "";
    byId("eventMember").value = event?.member || state.activeMember;
    byId("eventCategory").value = event?.category || "family";
    byId("eventDetails").value = event?.details || "";
    byId("deleteEvent").hidden = !event;
    dom.eventModal.showModal();
    setTimeout(() => byId("eventTitle").focus(), 30);
  }

  function saveEvent(event) {
    event.preventDefault();
    const id = byId("eventId").value;
    const entry = { id: id || uid("event"), title: byId("eventTitle").value.trim(), date: byId("eventDate").value, time: byId("eventTime").value, member: byId("eventMember").value, category: byId("eventCategory").value, details: byId("eventDetails").value.trim() };
    if (!entry.title || !entry.date) return;
    if (id) state.events = state.events.map(item => item.id === id ? entry : item); else state.events.push(entry);
    selectedKey = entry.date; viewDate = parseDateKey(entry.date); persist(id ? "Event updated" : "Event added"); dom.eventModal.close(); renderAll();
  }

  function deleteCurrentEvent() {
    const id = byId("eventId").value; if (!id) return; state.events = state.events.filter(item => item.id !== id); persist("Event deleted"); dom.eventModal.close(); renderAll();
  }

  function openQuickModal(type) {
    const labels = { task: ["Add a task", "What needs doing?", "e.g. Pick up the dry cleaning"], shopping: ["Add to shopping", "Shopping item", "e.g. Coffee beans"], note: ["Add a note", "Note", "Write a family reminder"] };
    const config = labels[type] || labels.task;
    byId("quickType").value = type; byId("quickModalTitle").textContent = config[0]; byId("quickTextLabel").firstChild.textContent = config[1]; byId("quickText").placeholder = config[2]; byId("quickText").value = ""; byId("quickOwnerLabel").hidden = false; byId("quickOwner").value = state.activeMember;
    dom.quickModal.showModal(); setTimeout(() => byId("quickText").focus(), 30);
  }

  function saveQuick(event) {
    event.preventDefault(); const type = byId("quickType").value; const text = byId("quickText").value.trim(); const owner = byId("quickOwner").value; if (!text) return;
    if (type === "note") state.notes.unshift({ id: uid("note"), text, owner, created: "Today" });
    else if (type === "shopping") state.shopping.push({ id: uid("shop"), text, owner, done: false });
    else state.tasks.push({ id: uid("task"), text, owner, done: false });
    persist(type === "note" ? "Note added" : type === "shopping" ? "Shopping item added" : "Task added"); dom.quickModal.close(); renderAll();
  }

  function showToast(message, isError = false) {
    dom.toast.textContent = message; dom.toast.className = `toast show${isError ? " error" : ""}`; clearTimeout(toastTimer); toastTimer = setTimeout(() => dom.toast.className = "toast", 2800);
  }

  function weatherLabel(code) {
    if (code === 0) return "Clear"; if (code === 1) return "Mainly clear"; if (code === 2) return "Partly cloudy"; if (code === 3) return "Overcast"; if (code <= 48) return "Foggy"; if (code <= 57) return "Drizzle"; if (code <= 67) return "Rain"; if (code <= 77) return "Snow"; if (code <= 82) return "Showers"; if (code <= 86) return "Snow showers"; return "Thunderstorms";
  }
  function weatherEmoji(code, isDay = 1) { if (code === 0) return isDay ? "☀️" : "🌙"; if (code <= 2) return isDay ? "🌤️" : "☁️"; if (code === 3) return "☁️"; if (code <= 48) return "🌫️"; if (code <= 67) return "🌧️"; if (code <= 77) return "🌨️"; if (code <= 82) return "🌦️"; if (code <= 86) return "🌨️"; return "⛈️"; }

  async function loadWeather(withFeedback = false) {
    if (withFeedback) showToast(`Refreshing ${state.weather.name} weather…`);
    try {
      const params = new URLSearchParams({
        latitude: String(state.weather.latitude),
        longitude: String(state.weather.longitude),
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        forecast_days: "4",
        timezone: state.weather.timezone || "auto",
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Weather unavailable");
      const weather = await response.json();
      dom.weatherLocationName.textContent = state.weather.name;
      dom.weatherTemp.textContent = `${Math.round(weather.current.temperature_2m)}°C`;
      dom.weatherCurrentIcon.textContent = weatherEmoji(weather.current.weather_code, weather.current.is_day);
      dom.weatherText.textContent = `${weatherLabel(weather.current.weather_code)} · Feels ${Math.round(weather.current.apparent_temperature)}°`;
      dom.weatherHumidity.textContent = `${Math.round(weather.current.relative_humidity_2m)}%`;
      dom.weatherWind.textContent = `${Math.round(weather.current.wind_speed_10m)} km/h`;
      dom.forecast.replaceChildren();
      for (let index = 1; index < Math.min(4, weather.daily.time.length); index += 1) {
        const row = document.createElement("div"); const day = document.createElement("span"); day.textContent = formatDate(parseDateKey(weather.daily.time[index]), { weekday: "short" }); const icon = document.createElement("b"); icon.textContent = weatherEmoji(weather.daily.weather_code[index]); const temp = document.createElement("small"); temp.innerHTML = `${Math.round(weather.daily.temperature_2m_max[index])}° <em>${Math.round(weather.daily.temperature_2m_min[index])}°</em>`; row.append(day, icon, temp); dom.forecast.append(row);
      }
      if (withFeedback) showToast("Weather updated");
    } catch {
      dom.weatherText.textContent = "Weather unavailable";
      if (withFeedback) showToast("Weather is unavailable right now", true);
    }
  }

  function openWeatherModal() {
    byId("weatherSearchInput").value = "";
    dom.weatherSearchResults.replaceChildren();
    dom.weatherSearchStatus.textContent = `Current location: ${state.weather.name}`;
    dom.weatherModal.showModal();
    setTimeout(() => byId("weatherSearchInput").focus(), 30);
  }

  async function searchWeatherLocations(event) {
    event.preventDefault();
    const query = byId("weatherSearchInput").value.trim();
    if (query.length < 2) return;
    byId("weatherSearchButton").disabled = true;
    dom.weatherSearchStatus.textContent = "Searching…";
    dom.weatherSearchResults.replaceChildren();
    try {
      const params = new URLSearchParams({ name: query, count: "8", language: "en", format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Search failed");
      const payload = await response.json();
      const results = safeArray(payload.results);
      if (!results.length) { dom.weatherSearchStatus.textContent = "No matching locations found. Try adding a state or country."; return; }
      results.forEach(location => dom.weatherSearchResults.append(createLocationResult(location)));
      dom.weatherSearchStatus.textContent = `${results.length} location${results.length === 1 ? "" : "s"} found.`;
      refreshIcons(dom.weatherSearchResults);
    } catch {
      dom.weatherSearchStatus.textContent = "Location search is unavailable right now. Please try again.";
    } finally {
      byId("weatherSearchButton").disabled = false;
    }
  }

  function createLocationResult(location) {
    const button = document.createElement("button"); button.type = "button"; button.className = "location-result"; button.setAttribute("role", "option"); button.append(makeIcon("map-pin"));
    const copy = document.createElement("span"); const name = document.createElement("strong"); name.textContent = location.name; const details = document.createElement("small"); details.textContent = [location.admin1, location.country].filter(Boolean).join(", "); copy.append(name, details);
    const country = document.createElement("span"); country.className = "location-country"; country.textContent = location.country_code || "";
    button.append(copy, country);
    button.addEventListener("click", () => selectWeatherLocation({ name: location.name, admin: location.admin1 || "", country: location.country || "", latitude: location.latitude, longitude: location.longitude, timezone: location.timezone || "auto" }));
    return button;
  }

  async function selectWeatherLocation(location) {
    state.weather = normalizeWeather(location);
    persist();
    updateSettings();
    dom.weatherModal.close();
    await loadWeather(true);
  }

  function useCurrentWeatherLocation() {
    if (!navigator.geolocation) { dom.weatherSearchStatus.textContent = "Location services are not available in this browser."; return; }
    const button = byId("useCurrentLocation"); button.disabled = true; dom.weatherSearchStatus.textContent = "Requesting this monitor’s location…";
    navigator.geolocation.getCurrentPosition(
      position => { button.disabled = false; selectWeatherLocation({ name: "Current location", admin: "", country: "", latitude: position.coords.latitude, longitude: position.coords.longitude, timezone: "auto" }); },
      error => { button.disabled = false; dom.weatherSearchStatus.textContent = error.code === 1 ? "Location permission was declined. Search for your city instead." : "The monitor’s location could not be found. Search for your city instead."; },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 1800000 },
    );
  }

  function resizePhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = () => reject(new Error("read")); reader.onload = () => {
        const image = new Image(); image.onerror = () => reject(new Error("image")); image.onload = () => {
          const max = 1280; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement("canvas"); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); const context = canvas.getContext("2d"); context.drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", .82));
        }; image.src = reader.result;
      }; reader.readAsDataURL(file);
    });
  }

  async function addPhotos(files) {
    const images = [...files].filter(file => file.type.startsWith("image/")).slice(0, 8); if (!images.length) return; showToast("Preparing photos…");
    for (const image of images) { try { state.photos.push(await resizePhoto(image)); if (state.photos.length > 24) state.photos.shift(); } catch { showToast("One photo could not be added", true); } }
    persist("Photos added"); renderPhotos(); byId("photoInput").value = "";
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `gilvarry-calendar-${perthDateKey()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast("Backup downloaded");
  }

  function importData(file) {
    if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(String(reader.result)); state = normalizeState(imported); persist("Calendar restored"); renderAll(); } catch { showToast("That backup file could not be read", true); } }; reader.onerror = () => showToast("That backup file could not be read", true); reader.readAsText(file);
  }

  function bindEvents() {
    document.querySelectorAll(".member").forEach(button => button.addEventListener("click", () => { state.activeMember = button.dataset.member; persist(); renderMember(); showToast(`Switched to ${state.activeMember}`); }));
    document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => showSection(button.dataset.section)));
    document.querySelectorAll("[data-calendar-view]").forEach(button => button.addEventListener("click", () => { state.calendarView = button.dataset.calendarView; persist(); renderCalendar(); }));
    document.querySelectorAll("[data-open-quick]").forEach(button => button.addEventListener("click", () => openQuickModal(button.dataset.openQuick)));
    byId("previousPeriod").addEventListener("click", () => shiftPeriod(-1)); byId("nextPeriod").addEventListener("click", () => shiftPeriod(1)); byId("todayButton").addEventListener("click", goToday);
    ["quickAddEvent", "addAgendaEvent"].forEach(id => byId(id).addEventListener("click", () => openEventModal()));
    ["uploadPhotoButton", "quickAddPhoto"].forEach(id => byId(id).addEventListener("click", () => { showSection("photos"); byId("photoInput").click(); }));
    byId("photoInput").addEventListener("change", event => addPhotos(event.target.files));
    dom.eventForm.addEventListener("submit", saveEvent); dom.quickForm.addEventListener("submit", saveQuick); byId("deleteEvent").addEventListener("click", deleteCurrentEvent);
    document.querySelectorAll(".close-modal").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
    [dom.eventModal, dom.quickModal, dom.weatherModal].forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) modal.close(); }));
    byId("timeFormatToggle").addEventListener("click", () => { state.use24Hour = !state.use24Hour; persist(); updateClock(); renderAll(); });
    ["weatherLocationButton", "changeWeatherLocation"].forEach(id => byId(id).addEventListener("click", openWeatherModal));
    dom.weatherSearchForm.addEventListener("submit", searchWeatherLocations); byId("useCurrentLocation").addEventListener("click", useCurrentWeatherLocation);
    byId("refreshWeather").addEventListener("click", () => loadWeather(true)); byId("exportData").addEventListener("click", exportData); byId("importDataButton").addEventListener("click", () => byId("importInput").click()); byId("importInput").addEventListener("change", event => importData(event.target.files[0]));
    byId("resetData").addEventListener("click", () => { if (!window.confirm("Reset this device to the original Gilvarry sample calendar?")) return; state = defaultState(); selectedKey = perthDateKey(); viewDate = parseDateKey(selectedKey); persist("Sample calendar restored"); renderAll(); showSection("calendar"); });
  }

  function init() {
    cacheDom(); bindEvents(); updateClock(); renderAll(); loadWeather(); setInterval(updateClock, 30000); setInterval(loadWeather, 1800000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
