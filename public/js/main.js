const header = document.querySelector('.motion-header');
const title = document.querySelector('.motion-title');

// Scroll effect on .motion-header
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Mouse move effect on .motion-title
if (title) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 30 - 15;
    const y = (e.clientY / window.innerHeight) * 30 - 15;

    title.style.setProperty('--move-x', `${x}px`);
    title.style.setProperty('--move-y', `${y}px`);
    title.classList.add('motion-move');

    clearTimeout(title._timeout);
    title._timeout = setTimeout(() => {
      title.style.setProperty('--move-x', `0px`);
      title.style.setProperty('--move-y', `0px`);
      title.classList.remove('motion-move');
    }, 1000);
  });
}

/// Scroll effect on .motion-navbar
window.addEventListener("scroll", () => {
  const motionNavbar = document.querySelector(".motion-navbar");
  if (motionNavbar) {
    motionNavbar.classList.toggle("scrolled", window.scrollY > 50);
  }
});



