import { initNavbar } from '../components/navbar.js';
import { initFooter } from '../components/footer.js';
import { createRecipeCard } from '../components/recipe-card.js';
import { getRecipes } from '../firebase/firestore.js';
import { CATEGORIES } from '../utils.js';
import { createLoader } from '../components/loader.js';

initNavbar();
initFooter();

// Category images (Unsplash placeholders)
const categoryImages = {
  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  Lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  Dinner: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  Dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  Snacks: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80',
  Drinks: 'https://images.immediate.co.uk/production/volatile/sites/30/2020/01/retro-cocktails-b12b00d.jpg?quality=90&resize=708,643',
  Healthy: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  Vegetarian: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSkCIbmPNO4PYgpu0RE10XgfCQ6O90RYG7IHRlaLlRTw&s=10'
};

function renderCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="col-6 col-md-3">
      <a href="recipes.html?category=${encodeURIComponent(cat)}" class="category-card d-block text-decoration-none">
        <img src="${categoryImages[cat] || categoryImages.Dinner}" alt="${cat}" loading="lazy">
        <div class="category-card-overlay">
          <span class="category-card-name">${cat}</span>
        </div>
      </a>
    </div>
  `).join('');
}

async function loadFeatured() {
  const container = document.getElementById('featured-recipes');
  if (!container) return;
  container.appendChild(createLoader('Loading delicious recipes...'));

  try {
    const { recipes } = await getRecipes({ sort: 'rating', pageSize: 8 });
    container.innerHTML = '';
    if (!recipes.length) {
      // Demo cards if no data yet
      const demos = [
        { id: 'demo1', title: 'Creamy Garlic Pasta', description: 'Rich, comforting pasta with roasted garlic and parmesan.', category: 'Dinner', cookTime: 25, ratingAvg: 4.8, authorName: 'Chef Maria', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80' },
        { id: 'demo2', title: 'Berry Breakfast Bowl', description: 'Fresh berries, granola and Greek yogurt for a perfect start.', category: 'Breakfast', cookTime: 10, ratingAvg: 4.6, authorName: 'Alex', imageUrl: 'https://images.unsplash.com/photo-1490474414430-fffb25b8e0e6?w=600&q=80' },
        { id: 'demo3', title: 'Chocolate Lava Cake', description: 'Decadent molten chocolate cake that melts in your mouth.', category: 'Dessert', cookTime: 20, ratingAvg: 4.9, authorName: 'Sophie', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80' },
        { id: 'demo4', title: 'Grilled Veggie Salad', description: 'Colorful grilled vegetables with lemon vinaigrette.', category: 'Healthy', cookTime: 30, ratingAvg: 4.5, authorName: 'Jordan', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' }
      ];
      demos.forEach(r => container.appendChild(createRecipeCard(r, { showFav: false })));
    } else {
      recipes.forEach(r => container.appendChild(createRecipeCard(r)));
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-muted text-center">Unable to load recipes. Configure Firebase to see live data.</p>';
  }
}

// GSAP animations
function initAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero-content > *', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out'
  });

  gsap.from('#featured .section-title, #featured .section-subtitle', {
    scrollTrigger: { trigger: '#featured', start: 'top 80%' },
    y: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  loadFeatured();
  initAnimations();
});