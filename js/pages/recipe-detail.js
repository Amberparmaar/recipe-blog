import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { getRecipe, incrementViews, getComments, addComment, isFavorite, addFavorite, removeFavorite, rateRecipe } from '../firebase/firestore.js';
import { onAuthChange } from '../firebase/auth.js';
import { getQueryParam, showToast, formatDate, renderStars, requireAuth } from '../utils.js';

initNavbar();
initFooter();

const id = getQueryParam('id');
const content = document.getElementById('recipe-detail-content');
let currentUser = null;
let recipe = null;

onAuthChange(u => { currentUser = u; });

async function load() {
  if (!id) {
    content.innerHTML = '<div class="empty-state"><h3>Recipe not found</h3><a href="recipes.html" class="btn btn-primary">Browse Recipes</a></div>';
    return;
  }
  try {
    recipe = await getRecipe(id);
    if (!recipe) {
      content.innerHTML = '<div class="empty-state"><h3>Recipe not found</h3><a href="recipes.html" class="btn btn-primary">Browse Recipes</a></div>';
      return;
    }
    try { await incrementViews(id); } catch(e){}
    render(recipe);
  } catch (err) {
    console.error(err);
    content.innerHTML = '<p class="text-center text-muted py-5">Failed to load. Check Firebase config.</p>';
  }
}

function render(r) {
  document.title = `${r.title} — FlavorVerse`;
  const total = (parseInt(r.prepTime)||0) + (parseInt(r.cookTime)||0);
  content.innerHTML = `
    <div class="row g-5">
      <div class="col-lg-8">
        <img src="${r.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900'}" alt="${r.title}" class="w-100 rounded-4 mb-4" style="max-height:420px;object-fit:cover" loading="lazy">
        <h1 class="mb-2">${r.title}</h1>
        <p class="text-muted mb-3">By <strong>${r.authorName || 'Chef'}</strong> · ${formatDate(r.createdAt)}</p>
        <p class="lead mb-4">${r.description || ''}</p>
        <div class="d-flex flex-wrap gap-2 mb-4">
          ${r.category ? `<span class="badge badge-primary">${r.category}</span>` : ''}
          ${r.difficulty ? `<span class="badge badge-secondary">${r.difficulty}</span>` : ''}
          ${(r.tags||[]).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <h3 class="mb-3">Ingredients</h3>
        <ul class="mb-4" style="list-style:disc;padding-left:1.25rem">
          ${(r.ingredients||[]).map(i => `<li class="mb-2">${i}</li>`).join('')}
        </ul>
        <h3 class="mb-3">Instructions</h3>
        <ol style="padding-left:1.25rem">
          ${(r.instructions||[]).map((s,i) => `<li class="mb-3"><strong>Step ${i+1}.</strong> ${s}</li>`).join('')}
        </ol>
        <hr class="my-5" style="border-color:var(--border)">
        <h3 class="mb-3">Comments</h3>
        <div id="comments-list" class="mb-4"></div>
        <form id="comment-form" class="d-none">
          <div class="form-group">
            <textarea id="comment-text" class="form-control" rows="3" placeholder="Share your thoughts..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Post Comment</button>
        </form>
        <p id="login-to-comment" class="text-muted">Please <a href="login.html">login</a> to comment.</p>
      </div>
      <div class="col-lg-4">
        <div class="card p-4 recipe-info-sticky">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>${renderStars(r.ratingAvg||0)} <span class="ms-1">${r.ratingAvg ? r.ratingAvg.toFixed(1) : '—'}</span></div>
            <button class="btn btn-ghost btn-sm" id="btn-fav"><i class="far fa-heart"></i> Favorite</button>
          </div>
          <ul class="list-unstyled mb-0">
            <li class="d-flex justify-content-between py-2 border-bottom border-subtle"><span class="text-muted">Prep</span><strong>${r.prepTime||'—'} min</strong></li>
            <li class="d-flex justify-content-between py-2 border-bottom border-subtle"><span class="text-muted">Cook</span><strong>${r.cookTime||'—'} min</strong></li>
            <li class="d-flex justify-content-between py-2 border-bottom border-subtle"><span class="text-muted">Total</span><strong>${total||'—'} min</strong></li>
            <li class="d-flex justify-content-between py-2 border-bottom border-subtle"><span class="text-muted">Servings</span><strong>${r.servings||'—'}</strong></li>
            <li class="d-flex justify-content-between py-2"><span class="text-muted">Difficulty</span><strong>${r.difficulty||'—'}</strong></li>
          </ul>
          <div class="mt-4">
            <label class="form-label">Rate this recipe</label>
            <div class="d-flex gap-1" id="rate-stars">
              ${[1,2,3,4,5].map(n => `<button type="button" class="btn btn-ghost btn-sm rate-btn" data-v="${n}"><i class="far fa-star"></i></button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Favorite
  const favBtn = document.getElementById('btn-fav');
  if (currentUser) {
    isFavorite(currentUser.uid, id).then(fav => {
      if (fav) { favBtn.innerHTML = '<i class="fas fa-heart text-danger"></i> Saved'; favBtn.classList.add('active'); }
    });
    favBtn.addEventListener('click', async () => {
      try {
        const isFav = favBtn.classList.contains('active');
        if (isFav) {
          await removeFavorite(currentUser.uid, id);
          favBtn.innerHTML = '<i class="far fa-heart"></i> Favorite';
          favBtn.classList.remove('active');
          showToast('Removed from favorites', '', 'info');
        } else {
          await addFavorite(currentUser.uid, id);
          favBtn.innerHTML = '<i class="fas fa-heart text-danger"></i> Saved';
          favBtn.classList.add('active');
          showToast('Added to favorites', '', 'success');
        }
      } catch(e) { showToast('Error', e.message, 'error'); }
    });
  } else {
    favBtn.addEventListener('click', () => location.href = 'login.html');
  }

  // Rating
  document.querySelectorAll('.rate-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentUser) return location.href = 'login.html';
      try {
        await rateRecipe(currentUser.uid, id, +btn.dataset.v);
        showToast('Thanks for rating!', '', 'success');
      } catch(e) { showToast('Error', e.message, 'error'); }
    });
  });

  // Comments
  if (currentUser) {
    document.getElementById('comment-form').classList.remove('d-none');
    document.getElementById('login-to-comment').classList.add('d-none');
    document.getElementById('comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = document.getElementById('comment-text').value.trim();
      if (!text) return;
      try {
        await addComment({
          recipeId: id,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'User',
          userPhoto: currentUser.photoURL || '',
          text
        });
        document.getElementById('comment-text').value = '';
        showToast('Comment posted', '', 'success');
        loadComments();
      } catch(e) { showToast('Error', e.message, 'error'); }
    });
  }
  loadComments();
}

async function loadComments() {
  const list = document.getElementById('comments-list');
  if (!list) return;
  try {
    const comments = await getComments(id);
    if (!comments.length) {
      list.innerHTML = '<p class="text-muted">No comments yet. Be the first!</p>';
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-avatar bg-secondary rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px">
          <i class="fas fa-user"></i>
        </div>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${c.userName}</span>
            <span class="comment-date">${formatDate(c.createdAt)}</span>
          </div>
          <p class="mb-0">${c.text}</p>
        </div>
      </div>
    `).join('');
  } catch(e) { list.innerHTML = ''; }
}

load();