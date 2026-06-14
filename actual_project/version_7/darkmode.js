//
//

const toggleDarkMode = () => {
  let displayMode = window.sessionStorage.getItem("displayMode") || "light";

  if (displayMode == "light") {
    displayMode = "dark";
    window.sessionStorage.setItem("displayMode", displayMode);
  } else {
    displayMode = "light";
    window.sessionStorage.setItem("displayMode", displayMode);
  }

  // Make transformations:
  const body = document.body;
  body.classList.toggle("dark-mode");
  _syncDarkModeCheckbox();
};

// Keeps the Settings-modal switch in sync with the actual mode.
const _syncDarkModeCheckbox = () => {
  const checkbox = document.getElementById("darkModeCheckbox");
  if (checkbox) {
    checkbox.checked =
      window.sessionStorage.getItem("displayMode") === "dark";
  }
};

// Restore dark mode state on page load (fixes: dark mode was lost on reload)
(function restoreDarkModeOnLoad() {
  const savedMode = window.sessionStorage.getItem("displayMode");
  if (savedMode === "dark") {
    document.body.classList.add("dark-mode");
  }
  _syncDarkModeCheckbox();
})();
