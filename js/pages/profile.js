/**
 * Profile page — view & edit user profile
 */

import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { onAuthChange, logout } from '../firebase/auth.js';
import { getUserProfile, updateUserProfile, getRecipesByAuthor, getFavorites } from '../firebase/firestore.js';
import { uploadImage } from '../cloudinary.js';
import { requireAuth, showToast, formatDate } from '../utils.js';
import { createRecipeCard } from '../components/recipe-card.js';
import { createLoader, createEmptyState } from '../components/loader.js';

initNavbar();
initFooter();
window.__flavorverse_page_init = true;

let currentUser = null;
let profile = null;

onAuthChange(async (user) => {
  currentUser = user;
  if (!requireAuth(user)) return;
  await loadProfile();
});

async function loadProfile() {
  const content = document.getElementById('profile-content');
  if (!content || !currentUser) return;

  try {
    profile = await getUserProfile(currentUser.uid);
    if (!profile) {
      // Fallback from Auth user
      profile = {
        name: currentUser.displayName || 'Chef',
        email: currentUser.email,
        photoURL: currentUser.photoURL || '',
        bio: '',
        createdAt: null,
      };
    }
    renderProfile();
  } catch (err) {
    console.error(err);
    content.innerHTML = '<p class="text-center text-muted py-5">Could not load profile. Check Firebase config.</p>';
  }
}

function renderProfile() {
  const content = document.getElementById('profile-content');
  const photo = profile.photoURL || currentUser.photoURL || '';
  const name = profile.name || currentUser.displayName || 'Chef';
  const bio = profile.bio || '';
  const email = profile.email || currentUser.email || '';

  content.innerHTML = `
    <div class="card p-4 mb-4">
      <div class="row align-items-center g-4">
        <div class="col-auto text-center">
          <div class="position-relative d-inline-block">
            <div id="avatar-preview" class="rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                 style="width:120px;height:120px;background:var(--card);border:3px solid var(--primary)">
              ${photo
                ? `<img src="${photo}" alt="${name}" style="width:100%;height:100%;object-fit:cover">`
                : `<i class="fas fa-user fa-3x text-muted"></i>`}
            </div>
            <label for="avatar-input" class="btn btn-primary btn-sm position-absolute bottom-0 end-0 rounded-circle"
                   style="width:36px;height:36px;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer"
                   title="Change photo">
              <i class="fas fa-camera"></i>
            </label>
            <input type="file" id="avatar-input" accept="image/*" hidden>
          </div>
        </div>
        <div class="col">
          <h1 class="h3 mb-1 text-white" id="display-name">${name}</h1>
          <p class="text-muted mb-2"><i class="fas fa-envelope me-1"></i> ${email}</p>
          <p class="mb-0" id="display-bio">${bio || '<span class="text-muted">No bio yet. Tell us about yourself!</span>'}</p>
          ${profile.createdAt ? `<p class="text-muted small mt-2 mb-0">Member since ${formatDate(profile.createdAt)}</p>` : ''}
        </div>
        <div class="col-12 col-md-auto">
          <button class="btn btn-ghost" id="btn-edit-profile"><i class="fas fa-edit"></i> Edit Profile</button>
          <button class="btn btn-ghost text-danger" id="btn-logout-profile"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    </div>

    <!-- Edit form (hidden by default) -->
    <div class="card p-4 mb-4 d-none" id="edit-profile-form">
      <h3 class="h5 mb-3">Edit Profile</h3>
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" id="edit-name" class="form-control" value="${name}" maxlength="60">
      </div>
      <div class="form-group">
        <label class="form-label">Bio</label>
        <textarea id="edit-bio" class="form-control" rows="3" maxlength="300" placeholder="A short bio about your cooking style...">${bio}</textarea>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-primary" id="btn-save-profile"><i class="fas fa-save"></i> Save</button>
        <button class="btn btn-ghost" id="btn-cancel-edit">Cancel</button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="h5 mb-0">My Recipes</h3>
          <a href="my-recipes.html" class="btn btn-ghost btn-sm">View all</a>
        </div>
        <div id="profile-recipes" class="row g-3"></div>
      </div>
      <div class="col-md-6">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="h5 mb-0">Favorites</h3>
          <a href="favorites.html" class="btn btn-ghost btn-sm">View all</a>
        </div>
        <div id="profile-favorites" class="row g-3"></div>
      </div>
    </div>
  `;

  // Events
  document.getElementById('btn-logout-profile')?.addEventListener('click', logout);
  document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
    document.getElementById('edit-profile-form').classList.remove('d-none');
  });
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => {
    document.getElementById('edit-profile-form').classList.add('d-none');
  });
  document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);
  document.getElementById('avatar-input')?.addEventListener('change', handleAvatarChange);

  loadPreviewLists();
}

async function saveProfile() {
  const name = document.getElementById('edit-name').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  if (!name) return showToast('Name required', '', 'error');

  try {
    await updateUserProfile(currentUser.uid, { name, bio });
    profile.name = name;
    profile.bio = bio;
    showToast('Profile updated', '', 'success');
    document.getElementById('edit-profile-form').classList.add('d-none');
    renderProfile();
  } catch (err) {
    console.error(err);
    showToast('Error', err.message || 'Could not update profile', 'error');
  }
}

async function handleAvatarChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    showToast('Uploading photo...', '', 'info');
    const url = await uploadImage(file);
    await updateUserProfile(currentUser.uid, { photoURL: url });
    profile.photoURL = url;
    showToast('Photo updated', '', 'success');
    renderProfile();
  } catch (err) {
    showToast('Upload failed', err.message, 'error');
  }
}

async function loadPreviewLists() {
  const recipesEl = document.getElementById('profile-recipes');
  const favsEl = document.getElementById('profile-favorites');
  if (!recipesEl || !favsEl) return;

  try {
    const recipes = await getRecipesByAuthor(currentUser.uid);
    recipesEl.innerHTML = '';
    if (!recipes.length) {
      recipesEl.innerHTML = createEmptyState('fa-utensils', 'No recipes yet', 'Share your first recipe!', 'Add Recipe', 'add-recipe.html');
    } else {
      recipes.slice(0, 2).forEach(r => {
        const col = createRecipeCard(r, { showFav: false });
        col.className = 'col-12';
        recipesEl.appendChild(col);
      });
    }
  } catch (e) {
    recipesEl.innerHTML = '<p class="text-muted small">Could not load recipes.</p>';
  }

  try {
    const favs = await getFavorites(currentUser.uid);
    favsEl.innerHTML = '';
    if (!favs.length) {
      favsEl.innerHTML = createEmptyState('fa-heart', 'No favorites', 'Save recipes you love.', 'Browse', 'recipes.html');
    } else {
      favs.slice(0, 2).forEach(r => {
        const col = createRecipeCard(r, { showFav: false });
        col.className = 'col-12';
        favsEl.appendChild(col);
      });
    }
  } catch (e) {
    favsEl.innerHTML = '<p class="text-muted small">Could not load favorites.</p>';
  }
}