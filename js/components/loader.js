export function createLoader(text = 'Loading...') {
  const div = document.createElement('div');
  div.className = 'text-center py-5';
  div.innerHTML = `
    <div class="spinner mx-auto"></div>
    <p class="loading-text mt-3">${text}</p>
  `;
  return div;
}

export function createEmptyState(icon, title, message, btnText, btnHref) {
  return `
    <div class="empty-state">
      <i class="fas ${icon}"></i>
      <h3>${title}</h3>
      <p>${message}</p>
      ${btnText ? `<a href="${btnHref}" class="btn btn-primary">${btnText}</a>` : ''}
    </div>
  `;
}