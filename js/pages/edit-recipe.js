/**
 * Edit Recipe page — load existing recipe, update fields & image
 */

import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { onAuthChange } from '../firebase/auth.js';
import { getRecipe, updateRecipe } from '../firebase/firestore.js';
import { uploadImage } from '../cloudinary.js';
import { CATEGORIES, showToast, requireAuth, getQueryParam } from '../utils.js';

initNavbar();
initFooter();
window.__flavorverse_page_init = true;

let currentUser = null;
let imageUrl = '';
let recipeId = getQueryParam('id');

onAuthChange(async (user) => {
  currentUser = user;
  if (!requireAuth(user)) return;
  await loadRecipe();
});

// Populate categories
const catSelect = document.getElementById('category');
CATEGORIES.forEach(c => {
  const o = document.createElement('option');
  o.value = c;
  o.textContent = c;
  catSelect.appendChild(o);
});

function addRow(containerId, placeholder, value = '') {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <input type="text" class="form-control" placeholder="${placeholder}" value="${value.replace(/"/g, '&quot;')}" required>
    <button type="button" class="btn btn-ghost btn-remove" aria-label="Remove"><i class="fas fa-times"></i></button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => {
    if (container.children.length > 1) row.remove();
  });
  container.appendChild(row);
}

document.getElementById('add-ingredient').addEventListener('click', () =>
  addRow('ingredients-list', 'e.g. 2 cups flour')
);
document.getElementById('add-instruction').addEventListener('click', () =>
  addRow('instructions-list', 'Describe this step...')
);

// Image upload
const uploadArea = document.getElementById('upload-area');
const imageInput = document.getElementById('image-input');
const previewWrap = document.getElementById('image-preview-wrap');
const progressBar = document.getElementById('upload-progress');

uploadArea.addEventListener('click', () => imageInput.click());
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', () => {
  if (imageInput.files[0]) handleFile(imageInput.files[0]);
});

function showPreview(url) {
  previewWrap.innerHTML = `
    <div class="image-preview">
      <img src="${url}" alt="Preview">
      <button type="button" class="btn btn-danger btn-sm remove-preview" id="remove-img"><i class="fas fa-trash"></i></button>
    </div>
  `;
  document.getElementById('remove-img')?.addEventListener('click', () => {
    imageUrl = '';
    previewWrap.innerHTML = '';
    imageInput.value = '';
  });
}

async function handleFile(file) {
  try {
    progressBar.classList.remove('d-none');
    const url = await uploadImage(file, pct => {
      progressBar.querySelector('.progress-bar').style.width = pct + '%';
    });
    imageUrl = url;
    progressBar.classList.add('d-none');
    showPreview(url);
    showToast('Image uploaded', '', 'success');
  } catch (err) {
    progressBar.classList.add('d-none');
    showToast('Upload failed', err.message, 'error');
  }
}

async function loadRecipe() {
  const loading = document.getElementById('edit-loading');
  const form = document.getElementById('edit-recipe-form');

  if (!recipeId) {
    loading.innerHTML = '<div class="empty-state"><h3>Recipe not found</h3><a href="my-recipes.html" class="btn btn-primary">My Recipes</a></div>';
    return;
  }

  try {
    const recipe = await getRecipe(recipeId);
    if (!recipe) {
      loading.innerHTML = '<div class="empty-state"><h3>Recipe not found</h3><a href="my-recipes.html" class="btn btn-primary">My Recipes</a></div>';
      return;
    }

    // Only author can edit
    if (recipe.authorId !== currentUser.uid) {
      showToast('Not allowed', 'You can only edit your own recipes', 'error');
      setTimeout(() => location.href = 'my-recipes.html', 1500);
      return;
    }

    // Fill form
    document.getElementById('title').value = recipe.title || '';
    document.getElementById('description').value = recipe.description || '';
    document.getElementById('category').value = recipe.category || '';
    document.getElementById('difficulty').value = recipe.difficulty || 'Easy';
    document.getElementById('prepTime').value = recipe.prepTime || '';
    document.getElementById('cookTime').value = recipe.cookTime || '';
    document.getElementById('servings').value = recipe.servings || '';
    document.getElementById('tags').value = (recipe.tags || []).join(', ');

    imageUrl = recipe.imageUrl || '';
    if (imageUrl) showPreview(imageUrl);

    const ingList = document.getElementById('ingredients-list');
    const instList = document.getElementById('instructions-list');
    ingList.innerHTML = '';
    instList.innerHTML = '';

    (recipe.ingredients || ['']).forEach(i => addRow('ingredients-list', 'e.g. 2 cups flour', i));
    (recipe.instructions || ['']).forEach(s => addRow('instructions-list', 'Describe this step...', s));

    if (!ingList.children.length) addRow('ingredients-list', 'e.g. 2 cups flour');
    if (!instList.children.length) addRow('instructions-list', 'Describe this step...');

    loading.classList.add('d-none');
    form.classList.remove('d-none');
  } catch (err) {
    console.error(err);
    loading.innerHTML = '<p class="text-center text-muted py-5">Failed to load recipe.</p>';
  }
}

// Submit update
document.getElementById('edit-recipe-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || !recipeId) return;

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const category = document.getElementById('category').value;
  const difficulty = document.getElementById('difficulty').value;
  const prepTime = document.getElementById('prepTime').value;
  const cookTime = document.getElementById('cookTime').value;
  const servings = document.getElementById('servings').value;
  const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);

  const ingredients = [...document.querySelectorAll('#ingredients-list input')].map(i => i.value.trim()).filter(Boolean);
  const instructions = [...document.querySelectorAll('#instructions-list input')].map(i => i.value.trim()).filter(Boolean);

  if (!title || !description || !category || !ingredients.length || !instructions.length) {
    return showToast('Missing fields', 'Please fill all required fields', 'error');
  }
  if (!imageUrl) {
    return showToast('Image required', 'Please keep or upload a recipe photo', 'error');
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

  try {
    await updateRecipe(recipeId, {
      title,
      description,
      imageUrl,
      category,
      ingredients,
      instructions,
      prepTime: prepTime || '',
      cookTime: cookTime || '',
      servings: servings || '',
      difficulty,
      tags
    });
    showToast('Recipe updated!', '', 'success');
    setTimeout(() => location.href = `recipe-detail.html?id=${recipeId}`, 1000);
  } catch (err) {
    console.error(err);
    showToast('Error', err.message || 'Could not update recipe', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
  }
});