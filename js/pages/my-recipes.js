/**
 * My Recipes dashboard — list, stats, edit, delete
 */

import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { onAuthChange } from '../firebase/auth.js';
import { getRecipesByAuthor, deleteRecipe, getFavorites } from '../firebase/firestore.js';
import { requireAuth, showToast } from '../utils.js';
import { createRecipeCard } from '../components/recipe-card.js';
import { createEmptyState } from '../components/loader.js';

initNavbar();
initFooter();
window.__flavorverse_page_init = true;

let currentUser = null;
let deleteId = null;
let deleteModal = null;

onAuthChange(async (user) => {
  currentUser = user;
  if (!requireAuth(user)) return;
  deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  await loadMyRecipes();
});

async function loadMyRecipes() {
  const grid = document.getElementById('my-recipes-grid');
  if (!grid || !currentUser) return;

  try {
    const recipes = await getRecipesByAuthor(currentUser.uid);
    const favorites = await getFavorites(currentUser.uid).catch(() => []);

    // Stats
    document.getElementById('stat-recipes').textContent = recipes.length;
    const totalViews = recipes.reduce((sum, r) => sum + (r.views || 0), 0);
    document.getElementById('stat-views').textContent = totalViews;
    document.getElementById('stat-favorites').textContent = favorites.length;

    grid.innerHTML = '';
    if (!recipes.length) {
      grid.innerHTML = createEmptyState(
        'fa-utensils',
        'No recipes yet',
        'Share your first delicious creation with the world.',
        'Add Recipe',
        'add-recipe.html'
      );
      return;
    }

    recipes.forEach(r => {
      const card = createRecipeCard(r, { showFav: false, showActions: true });
      grid.appendChild(card);
    });

    // Wire delete buttons
    grid.querySelectorAll('.btn-delete-recipe').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteId = btn.dataset.id;
        const title = recipes.find(r => r.id === deleteId)?.title || 'this recipe';
        document.getElementById('delete-recipe-title').textContent = title;
        deleteModal.show();
      });
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="text-muted text-center py-5">Could not load your recipes. Check Firebase config.</p>';
  }
}

document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
  if (!deleteId || !currentUser) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    await deleteRecipe(deleteId);
    showToast('Recipe deleted', '', 'success');
    deleteModal.hide();
    deleteId = null;
    await loadMyRecipes();
  } catch (err) {
    console.error(err);
    showToast('Error', err.message || 'Could not delete recipe', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
});