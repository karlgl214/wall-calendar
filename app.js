(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const SERVER_URL = String(window.CLEO_SERVER_URL || "").replace(/\/$/, "");
  const HISTORY_KEY = "cleo-owner-centre-maintenance-v1";
  const ACK_KEY = "cleo-owner-centre-alert-acks-v1";
  let toastTimer;
  let lastTelemetryAt = Date.now();
  let maintenanceHistory = loadHistory();
  let acknowledgedAlerts = loadAcknowledgements();

  function refreshIcons(root = document) {
    if (window.lucide) window.lucide.createIcons({ root, attrs: { "aria-hidden": "true" } });
  }

  function showToast(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    byId("clockNow").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    byId("dateNow").textContent = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    byId("greeting").textContent = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  }

  function updateTelemetryAge() {
    const seconds = Math.max(0, Math.floor((Date.now() - lastTelemetryAt) / 1000));
    const prefix = document.body.dataset.mode === "live" ? "Telemetry updated" : document.body.dataset.mode === "offline" ? "Last sample updated" : "Sample telemetry updated";
    byId("telemetryAge").textContent = `${prefix} ${seconds === 0 ? "just now" : `${seconds} second${seconds === 1 ? "" : "s"} ago`}`;
  }

  function setMode(mode, detail = {}) {
    document.body.dataset.mode = mode;
    const label = byId("modeLabel");
    const indicator = byId("environmentIndicator");
    const overview = byId("overviewLabel");
    const serverMode = byId("serverMode");
    const serverState = byId("serverState");
    const serverCopy = byId("serverCopy");
    const serverLink = byId("serverLinkState");
    const stateOrb = byId("serverStateOrb");
    indicator.dataset.mode = mode;

    if (mode === "live") {
      label.textContent = "LIVE";
      overview.textContent = "LIVE TELEMETRY";
      serverMode.textContent = "LIVE";
      serverState.textContent = detail.name || "Server Online";
      serverCopy.textContent = detail.copy || "Dashboard is communicating with Cleo.";
      serverLink.textContent = "Connected";
      serverLink.className = "online-text";
      stateOrb.className = "state-orb";
      byId("healthCopy").textContent = "Live core systems are operational.";
    } else if (mode === "offline") {
      label.textContent = "OFFLINE";
      overview.textContent = "CONNECTION REQUIRED";
      serverMode.textContent = "OFFLINE";
      serverState.textContent = "Server unreachable";
      serverCopy.textContent = "The configured Cleo endpoint did not respond.";
      serverLink.textContent = "No active connection";
      serverLink.className = "warning-text";
      stateOrb.className = "state-orb warning";
      byId("healthCopy").textContent = "Last sample is shown while Cleo is unavailable.";
    } else {
      label.textContent = "DEMO";
      overview.textContent = "DEMO ENVIRONMENT";
      serverMode.textContent = "DEMO";
      serverState.textContent = "No live server linked";
      serverCopy.textContent = "Sample telemetry only — dashboard cannot yet communicate with Cleo.";
      serverLink.textContent = "No active connection";
      serverLink.className = "warning-text";
      stateOrb.className = "state-orb warning";
      byId("healthCopy").textContent = "Sample core systems are operational.";
    }
    updateTelemetryAge();
  }

  function coalesce(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== "") ?? "—";
  }

  async function fetchTelemetry() {
    if (!SERVER_URL) {
      setMode("demo");
      return;
    }
    try {
      const response = await fetch(`${SERVER_URL}/health`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Health endpoint returned ${response.status}`);
      const data = await response.json();
      if (data.status && String(data.status).toLowerCase() !== "online" && data.healthy === false) throw new Error("Cleo server reported unhealthy");
      const system = data.system || {};
      const network = data.network || {};
      const ai = data.ai || data.workload || {};
      byId("linuxUptime").innerHTML = `${escapeText(coalesce(system.uptime, data.uptime, "—"))} <small>live</small>`;
      byId("serverNetwork").innerHTML = `${escapeText(coalesce(network.ip, data.ip, "—"))} · ${escapeText(coalesce(network.state, data.network_state, "Connected"))} <small>live</small>`;
      byId("uptimeValue").textContent = String(coalesce(system.uptime, data.uptime, "—"));
      byId("uptimeSince").textContent = `Live server start: ${coalesce(system.since, data.since, "not reported")}`;
      byId("modelName").textContent = String(coalesce(ai.model, data.model, "Cleo Core"));
      byId("requestCount").textContent = String(coalesce(ai.requests_running, data.requests_running, 0));
      byId("activeCleoUsers").textContent = String(coalesce(ai.active_users, data.active_users, 0));
      const responseTime = String(coalesce(ai.response_p95_ms, data.response_p95_ms, "—"));
      byId("responseTime").textContent = responseTime === "—" ? responseTime : `${responseTime} ms`;
      byId("responseP95").textContent = responseTime === "—" ? responseTime : `${responseTime} ms`;
      lastTelemetryAt = Date.now();
      setMode("live", { name: data.name || system.hostname || "Server Online" });
    } catch (error) {
      console.warn("Cleo Server telemetry unavailable:", error.message);
      setMode("offline");
    }
  }

  function escapeText(value) {
    return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function activateNavigation(button) {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    const section = button.dataset.section;
    byId("sectionTitle").textContent = section === "Dashboard" ? "Cleo Health Overview" : `${section} Overview`;
    const targets = {
      Users: ".user-table-panel",
      "Cleo AI": ".workload-card",
      Hardware: ".metrics-grid",
      Storage: '[data-detail="storage"]',
      Network: ".server-card",
      Security: ".security-card",
      Maintenance: ".maintenance-panel",
      Alerts: ".alerts-panel"
    };
    const target = targets[section] && document.querySelector(targets[section]);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (section === "Security") byId("securityReport").hidden = false;
    if (section === "Settings") showToast("Settings are protected and available to the Owner only.");
  }

  function runHealthCheck() {
    const button = byId("scanButton");
    const label = byId("scanLabel");
    const card = byId("healthCard");
    const state = byId("healthState");
    const copy = byId("healthCopy");
    if (button.classList.contains("scanning")) return;
    button.classList.add("scanning");
    button.disabled = true;
    label.textContent = "Checking…";
    state.textContent = "SCANNING";
    copy.textContent = "Running a safe local health check.";
    card.style.borderColor = "rgba(64, 213, 255, .75)";
    setTimeout(async () => {
      button.classList.remove("scanning");
      button.disabled = false;
      label.textContent = "Run health check";
      state.textContent = "HEALTHY";
      card.style.borderColor = "";
      lastTelemetryAt = Date.now();
      await fetchTelemetry();
      showToast(document.body.dataset.mode === "live" ? "Live health check completed." : "Demo health check completed — connect Cleo Server for live telemetry.");
    }, 1100);
  }

  function detailMarkup(type) {
    if (type === "gpu") {
      return {
        title: "GPU telemetry",
        content: `<div class="hardware-detail-grid"><article><span>GPU temperature</span><strong class="good">61°C</strong><small>Sample sensor reading</small></article><article><span>VRAM in use</span><strong>9.2 / 16 GB</strong><small>57% allocated</small></article><article><span>Power draw</span><strong>138 W</strong><small>Sample power telemetry</small></article><article><span>Fan speed</span><strong>1,620 RPM</strong><small>Within expected range</small></article><article class="full"><span>AI workload</span><strong class="good">43% utilization</strong><small>Cleo model inference workload — sample value</small></article></div>`
      };
    }
    return {
      title: "Storage detail",
      content: `<div class="hardware-detail-grid"><article><span>NVMe SSD · System</span><strong>1.86 TB / 2.00 TB</strong><small>Samsung 990 PRO · sample</small></article><article><span>SMART health</span><strong class="warn">82%</strong><small>Estimated wear remaining</small></article><article><span>Temperature</span><strong class="good">42°C</strong><small>Sample drive sensor</small></article><article><span>HDD · Archive</span><strong>3.1 TB / 4.0 TB</strong><small>Sample secondary drive</small></article><article class="full"><span>Recommended action</span><strong class="warn">Monitor NVMe wear</strong><small>Plan a replacement before health drops below 70%; acknowledge or record service in Maintenance.</small></article></div>`
    };
  }

  function openHardwareDialog(type) {
    const detail = detailMarkup(type);
    byId("hardwareDialogTitle").textContent = detail.title;
    byId("hardwareDetailContent").innerHTML = detail.content;
    byId("hardwareDialog").showModal();
  }

  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(data) ? data.filter((item) => item && item.component && item.date).slice(0, 20) : [];
    } catch { return []; }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(maintenanceHistory.slice(0, 20)));
  }

  function addHistory(component, date, note, source = "service") {
    maintenanceHistory.unshift({ component: String(component).slice(0, 70), date: String(date).slice(0, 10), note: String(note || "").slice(0, 160), source });
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    const root = byId("maintenanceHistory");
    root.replaceChildren();
    if (!maintenanceHistory.length) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "No recorded maintenance yet. Services and acknowledged alerts will appear here.";
      root.append(empty);
      return;
    }
    maintenanceHistory.slice(0, 3).forEach((item) => {
      const row = document.createElement("div");
      row.className = "history-row";
      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", item.source === "alert" ? "check-circle-2" : "wrench");
      const copy = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = item.component;
      copy.append(title);
      if (item.note) { const note = document.createElement("small"); note.textContent = item.note; copy.append(note); }
      const date = document.createElement("time");
      date.textContent = new Date(`${item.date}T12:00:00`).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
      row.append(icon, copy, date);
      root.append(row);
    });
    refreshIcons(root);
  }

  function loadAcknowledgements() {
    try {
      const data = JSON.parse(localStorage.getItem(ACK_KEY) || "[]");
      return Array.isArray(data) ? data.filter((id) => typeof id === "string") : [];
    } catch { return []; }
  }

  function saveAcknowledgements() { localStorage.setItem(ACK_KEY, JSON.stringify(acknowledgedAlerts)); }

  function renderAcknowledgements() {
    document.querySelectorAll("[data-alert-id]").forEach((row) => {
      const acknowledged = acknowledgedAlerts.includes(row.dataset.alertId);
      row.classList.toggle("acknowledged", acknowledged);
      const button = row.querySelector(".ack-button");
      button.textContent = acknowledged ? "Acknowledged" : "Acknowledge";
      button.disabled = acknowledged;
    });
    const count = document.querySelectorAll("[data-alert-id]").length - acknowledgedAlerts.length;
    byId("alertCount").textContent = String(Math.max(0, count));
    byId("alertCount").style.display = count ? "grid" : "none";
  }

  function acknowledgeAlert(row) {
    const id = row.dataset.alertId;
    if (!id || acknowledgedAlerts.includes(id)) return;
    acknowledgedAlerts.push(id);
    saveAcknowledgements();
    const message = row.querySelector("p").textContent;
    addHistory("Alert acknowledged", new Date().toISOString().slice(0, 10), message, "alert");
    renderAcknowledgements();
    showToast("Alert acknowledged and added to maintenance history.");
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      showToast("Fullscreen could not be enabled by this browser.");
    }
  }

  function updateFullscreenButton() {
    const button = byId("fullscreenButton");
    const active = Boolean(document.fullscreenElement);
    button.setAttribute("aria-label", active ? "Exit fullscreen mode" : "Enter fullscreen mode");
    button.title = active ? "Exit fullscreen mode" : "Fullscreen mode";
    button.innerHTML = `<i data-lucide="${active ? "minimize" : "maximize"}"></i>`;
    refreshIcons(button);
  }

  function bindInteractions() {
    document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => activateNavigation(button)));
    byId("scanButton").addEventListener("click", runHealthCheck);
    byId("fullscreenButton").addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenButton);

    byId("settingsButton").addEventListener("click", () => activateNavigation(document.querySelector('[data-section="Settings"]')));
    byId("usersToggle").addEventListener("click", (event) => {
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      event.currentTarget.setAttribute("aria-expanded", String(!expanded));
      event.currentTarget.firstChild.textContent = expanded ? "View All " : "Show recent ";
      document.querySelectorAll("#usersTable tr").forEach((row, index) => { row.style.background = !expanded && index > 1 ? "rgba(25, 100, 170, .16)" : ""; });
      showToast(expanded ? "Showing all registered users." : "Highlighting most recently active users.");
    });
    byId("alertsToggle").addEventListener("click", (event) => {
      const list = byId("alertsList");
      const expanded = list.classList.toggle("alerts-expanded");
      event.currentTarget.firstChild.textContent = expanded ? "Show less " : "View All ";
      event.currentTarget.setAttribute("aria-expanded", String(expanded));
    });
    byId("securityToggle").addEventListener("click", (event) => {
      const report = byId("securityReport");
      report.hidden = !report.hidden;
      event.currentTarget.firstChild.textContent = report.hidden ? "View report " : "Hide report ";
    });
    document.querySelectorAll(".metric-button").forEach((button) => button.addEventListener("click", () => openHardwareDialog(button.dataset.detail)));
    document.querySelectorAll(".close-modal").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
    byId("recordMaintenance").addEventListener("click", () => { byId("serviceDate").value = new Date().toISOString().slice(0, 10); byId("maintenanceDialog").showModal(); });
    byId("maintenanceForm").addEventListener("submit", (event) => {
      event.preventDefault();
      addHistory(byId("serviceComponent").value, byId("serviceDate").value, byId("serviceNotes").value);
      byId("maintenanceForm").reset();
      byId("maintenanceDialog").close();
      showToast("Service record saved on this device.");
    });
    document.querySelectorAll(".ack-button").forEach((button) => button.addEventListener("click", () => acknowledgeAlert(button.closest("[data-alert-id]"))));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    refreshIcons();
    updateClock();
    updateTelemetryAge();
    renderHistory();
    renderAcknowledgements();
    bindInteractions();
    updateFullscreenButton();
    await fetchTelemetry();
    setInterval(updateClock, 1000);
    setInterval(updateTelemetryAge, 1000);
    if (SERVER_URL) setInterval(fetchTelemetry, 15000);
  });
})();
