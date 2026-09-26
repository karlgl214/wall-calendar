(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  let toastTimer;

  function refreshIcons(root = document) {
    if (window.lucide) window.lucide.createIcons({ root, attrs: { "aria-hidden": "true" } });
  }

  function showToast(message) {
    const toast = byId("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function updateClock() {
    const now = new Date();
    const hour = now.getHours();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const date = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    byId("clockNow").textContent = time;
    byId("dateNow").textContent = date;
    byId("greeting").textContent = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  }

  function activateNavigation(button) {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
    const section = button.dataset.section;
    byId("sectionTitle").textContent = section === "Dashboard" ? "Cleo Health Overview" : `${section} Overview`;
    if (section !== "Dashboard") showToast(`${section} controls are ready to review.`);
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
    setTimeout(() => {
      button.classList.remove("scanning");
      button.disabled = false;
      label.textContent = "Run health check";
      state.textContent = "HEALTHY";
      copy.textContent = "All core systems operational.";
      card.style.borderColor = "";
      showToast("Health check completed — all core systems are operational.");
    }, 1300);
  }

  function bindInteractions() {
    document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => activateNavigation(button)));
    byId("scanButton").addEventListener("click", runHealthCheck);

    byId("settingsButton").addEventListener("click", () => {
      const settings = document.querySelector('[data-section="Settings"]');
      activateNavigation(settings);
      showToast("Settings are protected and available to the Owner only.");
    });

    byId("usersToggle").addEventListener("click", (event) => {
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      event.currentTarget.setAttribute("aria-expanded", String(!expanded));
      event.currentTarget.firstChild.textContent = expanded ? "View All " : "Show recent ";
      document.querySelectorAll("#usersTable tr").forEach((row, index) => {
        row.style.background = !expanded && index > 1 ? "rgba(25, 100, 170, .16)" : "";
      });
      showToast(expanded ? "Showing all registered users." : "Highlighting most recently active users.");
    });

    byId("alertsToggle").addEventListener("click", (event) => {
      const list = byId("alertsList");
      const expanded = list.classList.toggle("alerts-expanded");
      event.currentTarget.firstChild.textContent = expanded ? "Show less " : "View All ";
      event.currentTarget.setAttribute("aria-expanded", String(expanded));
      showToast(expanded ? "Displaying complete recent alert feed." : "Displaying the latest four alerts.");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    refreshIcons();
    updateClock();
    setInterval(updateClock, 1000);
    bindInteractions();
  });
})();
