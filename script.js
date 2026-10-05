const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#site-nav");

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

document.querySelectorAll(".sprite-stage img").forEach((image) => {
  const stage = image.closest(".sprite-stage");
  const useFallback = () => {
    image.hidden = true;
    stage?.classList.remove("has-art");
  };

  image.addEventListener("error", useFallback, { once: true });
  image.addEventListener("load", () => stage?.classList.add("has-art"), { once: true });
  if (image.complete) {
    if (image.naturalWidth === 0) useFallback();
    else stage?.classList.add("has-art");
  }
});
