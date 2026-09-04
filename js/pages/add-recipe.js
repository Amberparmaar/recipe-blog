import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { onAuthChange } from '../firebase/auth.js';
import { createRecipe } from '../firebase/firestore.js';
import { uploadImage } from '../cloudinary.js';
import { CATEGORIES, showToast, requireAuth, showLoader, hideLoader } from '../utils.js';

initNavbar();
initFooter();

let currentUser = null;
let imageUrl = '';

onAuthChange(user => {
  currentUser = user;
  if (!requireAuth(user)) return;
});

// Populate categories
const catSelect = document.getElementById('category');
CATEGORIES.forEach(c => {
  const o = document.createElement('option');
  o.value = c; o.textContent = c;
  catSelect.appendChild(o);
});

// Dynamic rows
function addRow(containerId, placeholder) {
  const container = document.getElementById(containerId);
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <input type="text" class="form-control" placeholder="${placeholder}" required>
    <button type="button" class="btn btn-ghost btn-remove" aria-label="Remove"><i class="fas fa-times"></i></button>
  `;
  row.querySelector('.btn-remove').addEventListener('click', () => {
    if (container.children.length > 1) row.remove();
  });
  container.appendChild(row);
}

document.getElementById('add-ingredient').addEventListener('click', () => addRow('ingredients-list', 'e.g. 2 cups flour'));
document.getElementById('add-instruction').addEventListener('click', () => addRow('instructions-list', 'Describe this step...'));
addRow('ingredients-list', 'e.g. 2 cups flour');
addRow('instructions-list', 'Describe this step...');

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

async function handleFile(file) {
  try {
    progressBar.classList.remove('d-none');
    const url = await uploadImage(file, pct => {
      progressBar.querySelector('.progress-bar').style.width = pct + '%';
    });
    imageUrl = url;
    progressBar.classList.add('d-none');
    previewWrap.classList.remove('d-none');
    previewWrap.innerHTML = `
      <div class="image-preview">
        <img src="${url}" alt="Preview">
        <button type="button" class="btn btn-danger btn-sm remove-preview" id="remove-img"><i class="fas fa-trash"></i></button>
      </div>
    `;
    document.getElementById('remove-img').addEventListener('click', () => {
      imageUrl = '';
      previewWrap.classList.add('d-none');
      imageInput.value = '';
    });
    showToast('Image uploaded', 'Looking delicious!', 'success');
  } catch (err) {
    progressBar.classList.add('d-none');
    showToast('Upload failed', err.message, 'error');
  }
}

// Submit
document.getElementById('add-recipe-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return showToast('Please login', '', 'error');

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
    return showToast('Image required', 'Please upload a recipe photo', 'error');
  }

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Publishing...';

  try {
    const id = await createRecipe({
      title,
      description,
      imageUrl,
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Chef',
      category,
      ingredients,
      instructions,
      prepTime: prepTime || '',
      cookTime: cookTime || '',
      servings: servings || '',
      difficulty,
      tags
    });
    showToast('Recipe published!', 'Your creation is live', 'success');
    setTimeout(() => location.href = `recipe-detail.html?id=${id}`, 1000);
  } catch (err) {
    console.error(err);
    showToast('Error', err.message || 'Could not save recipe', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-utensils"></i> Publish Recipe';
  }
});