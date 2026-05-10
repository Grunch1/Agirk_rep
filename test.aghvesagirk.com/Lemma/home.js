function toggleNavbar() {
  console.log("Toggle button clicked");
  const navbarPages = document.getElementById("navbarSupportedContent");
  if (!navbarPages) return;

  navbarPages.classList.toggle("show");
  const navbarToggleButton = document.querySelector(".navbar-toggler");
  if (navbarToggleButton) {
    navbarToggleButton.setAttribute(
      "aria-expanded",
      navbarPages.classList.contains("show") ? "true" : "false"
    );
  }
}

function loadManuscripts() {
  const placeholder = document.getElementById("Manuscript");
  if (!placeholder) return Promise.resolve();

  return fetch("manuscripts.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error loading HTML: ${response.statusText}`);
      }
      return response.text();
    })
    .then((html) => {
      placeholder.innerHTML = html;
    })
    .catch((error) => {
      console.error("Failed to load manuscripts:", error);
      placeholder.innerHTML = "<p>Manuscript list could not be loaded.</p>";
    });
}

function loadNavbar() {
  return fetch("navbar.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;

      const navbarToggleButton = document.querySelector(".navbar-toggler");
      if (navbarToggleButton) {
        navbarToggleButton.addEventListener("click", toggleNavbar);
      }

      document.querySelectorAll("#navbar .nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          if (window.innerWidth < 1405) {
            const navbarPages = document.getElementById("navbarSupportedContent");
            if (navbarPages) {
              navbarPages.classList.remove("show");
            }
          }
        });
      });
    })
    .catch((error) => console.error("Error loading navbar:", error));
}

function handleSectionNavigation() {
  const sections = document.querySelectorAll("section");
  const heading = document.querySelector("#page-heading");
  const fragment = window.location.hash;
  const targetSection = fragment
    ? document.querySelector(fragment)
    : document.querySelector("#About");

  sections.forEach((section) => {
    section.style.display = "none";
  });

  if (!targetSection) {
    console.error(`Section ${fragment} not found.`);
    return;
  }

  targetSection.style.display = "block";
  const sectionName = targetSection.getAttribute("data-heading") || targetSection.id;
  if (heading) {
    heading.textContent = sectionName;
  }

  document.title = `${sectionName} - Aghvesagirk`;

  if (fragment) {
    targetSection.scrollIntoView({ behavior: "smooth" });
  }

  const navbarPages = document.getElementById("navbarSupportedContent");
  if (window.innerWidth < 1405 && navbarPages) {
    navbarPages.classList.remove("show");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadManuscripts();
  loadNavbar().then(handleSectionNavigation);
  window.addEventListener("hashchange", handleSectionNavigation);
});
