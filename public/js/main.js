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

// Simple slider logic
let current = 0;
const slides = document.querySelectorAll(".slide");

function showNextSlide() {
  slides[current].classList.remove("active");
  current = (current + 1) % slides.length;
  slides[current].classList.add("active");
}

setInterval(showNextSlide, 5000); // change slide every 5 seconds
 45c044b (WIP: prepare for rebase before push)
 
 // public/js/main.js

// …existing code…

window.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('userList');
  if (!listEl) return;

  fetch('/users')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not OK');
      return res.json();
    })
    .then(users => {
      if (users.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No users found.';
        listEl.appendChild(li);
        return;
      }
      users.forEach(u => {
        const li = document.createElement('li');
        const joinedDate = new Date(u.joined).toLocaleString();
        li.textContent = `${u.name} (${u.email}) — joined: ${joinedDate}`;
        listEl.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Error fetching users:', err);
      const li = document.createElement('li');
      li.textContent = 'Failed to load users.';
      li.style.color = 'red';
      listEl.appendChild(li);
    });
});



