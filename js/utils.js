/**
 * Utility helpers used across the app
 */

/** Show a toast notification */
export function showToast(title, message = '', type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 4500);
}

/** Simple debounce */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Format date nicely */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/** Generate stars HTML */
export function renderStars(rating = 0) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      html += '<i class="fas fa-star"></i>';
    } else if (i === full + 1 && half) {
      html += '<i class="fas fa-star-half-alt"></i>';
    } else {
      html += '<i class="far fa-star empty"></i>';
    }
  }
  html += '</span>';
  return html;
}

/** Validate email */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Get query param */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Protected route helper - redirect if not logged in */
export function requireAuth(user) {
  if (!user) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

/** Show/hide global loader */
export function showLoader(text = 'Loading...') {
  let overlay = document.querySelector('.loader-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loader-overlay';
    overlay.innerHTML = `
      <div class="text-center">
        <div class="spinner"></div>
        <p class="loading-text">${text}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.querySelector('.loading-text').textContent = text;
    overlay.style.display = 'flex';
  }
}

export function hideLoader() {
  const overlay = document.querySelector('.loader-overlay');
  if (overlay) overlay.style.display = 'none';
}

/** Categories list */
export const CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Dessert',
  'Snacks', 'Drinks', 'Healthy', 'Vegetarian'
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];