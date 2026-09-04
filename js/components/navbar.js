/**
 * Renders the sticky navbar and updates auth links based on user state
 */

import { onAuthChange, logout } from '../firebase/auth.js';

export function initNavbar() {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  placeholder.innerHTML = `
    <nav class="navbar navbar-expand-lg">
      <div class="container">
        <a class="navbar-brand" href="index.html">🍴 <span>Flavor</span>Verse</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item me-2"><a class="nav-link" href="index.html" data-page="home">Home</a></li>
            <li class="nav-item me-2"><a class="nav-link" href="recipes.html" data-page="recipes">Recipes</a></li>
            <li class="nav-item me-2"><a class="nav-link" href="recipes.html?category=Breakfast" data-page="categories">Categories</a></li>
            <li class="nav-item me-2 d-none" id="nav-my-recipes"><a class="nav-link" href="my-recipes.html">My Recipes</a></li>
            <li class="nav-item me-2 d-none" id="nav-favorites"><a class="nav-link" href="favorites.html">Favorites</a></li>
          </ul>
          <div class="d-flex align-items-center gap-2" id="nav-auth-area">
            <!-- filled by auth state -->
          </div>
        </div>
      </div>
    </nav>
  `;

  // Highlight current page
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });

  onAuthChange(user => {
    const area = document.getElementById('nav-auth-area');
    const myRecipes = document.getElementById('nav-my-recipes');
    const fav = document.getElementById('nav-favorites');

    if (user) {
      myRecipes?.classList.remove('d-none');
      fav?.classList.remove('d-none');
      area.innerHTML = `
        <a href="add-recipe.html" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Add Recipe</a>
        <a href="profile.html" class="btn btn-ghost btn-sm">
          <i class="fas fa-user"></i> ${user.displayName || 'Profile'}
        </a>
        <button class="btn btn-ghost btn-sm" id="btn-logout"><i class="fas fa-sign-out-alt"></i></button>
      `;
      document.getElementById('btn-logout')?.addEventListener('click', logout);
    } else {
      myRecipes?.classList.add('d-none');
      fav?.classList.add('d-none');
      area.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">Login</a>
        <a href="signup.html" class="btn btn-primary btn-sm">Sign Up</a>
      `;
    }
  });
}