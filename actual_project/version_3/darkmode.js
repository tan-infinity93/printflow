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

  // const workspace = document.getElementById("workspace");
  // workspace.style.display = "none";
  // workspace.offsetHeight;
  // workspace.style.display = "";
};

// toggleDarkMode();
