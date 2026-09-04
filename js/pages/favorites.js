/**
 * Favorites page — list saved recipes, remove favorite
 */

import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { onAuthChange } from '../firebase/auth.js';
import { getFavorites, removeFavorite } from '../firebase/firestore.js';
import { requireAuth, showToast } from '../utils.js';
import { createRecipeCard } from '../components/recipe-card.js';
import { createEmptyState } from '../components/loader.js';

initNavbar();
initFooter();
window.__flavorverse_page_init = true;

let currentUser = null;

onAuthChange(async (user) => {
  currentUser = user;
  if (!requireAuth(user)) return;
  await loadFavorites();
});

async function loadFavorites() {
  const grid = document.getElementById('favorites-grid');
  if (!grid || !currentUser) return;

  try {
    const recipes = await getFavorites(currentUser.uid);
    grid.innerHTML = '';

    if (!recipes.length) {
      grid.innerHTML = createEmptyState(
        'fa-heart',
        'No favorites yet',
        'Browse recipes and tap the heart to save them here.',
        'Explore Recipes',
        'recipes.html'
      );
      return;
    }

    recipes.forEach(r => {
      const card = createRecipeCard(r, {
        showFav: true,
        isFav: true,
        onFavClick: async (recipeId, btnEl) => {
          try {
            await removeFavorite(currentUser.uid, recipeId);
            showToast('Removed from favorites', '', 'info');
            // Remove card from UI
            btnEl.closest('.col-sm-6, .col-lg-4, .col-xl-3')?.remove();
            // If empty, show empty state
            if (!grid.querySelector('.recipe-card')) {
              grid.innerHTML = createEmptyState(
                'fa-heart',
                'No favorites yet',
                'Browse recipes and tap the heart to save them here.',
                'Explore Recipes',
                'recipes.html'
              );
            }
          } catch (err) {
            showToast('Error', err.message, 'error');
          }
        }
      });
      grid.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="text-muted text-center py-5">Could not load favorites. Check Firebase config.</p>';
  }
}