// import { initNavbar } from '../components/navbar.js';
// import { initFooter } from '../components/footer.js';
// import { createRecipeCard } from '../components/recipe-card.js';
// import { getRecipes, searchRecipes,   addFavorite,
//   removeFavorite,
//   isFavorite } from '../firebase/firestore.js';
// import { CATEGORIES, debounce, getQueryParam,  requireAuth,
//   showToast } from '../utils.js';
// import { createLoader, createEmptyState } from '../components/loader.js';

// let currentUser = null;

// onAuthChange(user => {
//   currentUser = user;
// });
// initNavbar();
// initFooter();

// const grid = document.getElementById('recipes-grid');
// const categorySelect = document.getElementById('filter-category');
// const difficultySelect = document.getElementById('filter-difficulty');
// const sortSelect = document.getElementById('filter-sort');
// const searchInput = document.getElementById('search-input');

// // Populate categories
// CATEGORIES.forEach(c => {
//   const opt = document.createElement('option');
//   opt.value = c;
//   opt.textContent = c;
//   categorySelect.appendChild(opt);
// });

// // Pre-select from URL
// const urlCat = getQueryParam('category');
// if (urlCat) categorySelect.value = urlCat;

// async function loadRecipes() {
//   grid.innerHTML = '';
//   grid.appendChild(createLoader());

//   const category = categorySelect.value || null;
//   const difficulty = difficultySelect.value || null;
//   const sort = sortSelect.value;
//   const term = searchInput.value.trim();

//   try {
//     let recipes;
//     if (term) {
//       recipes = await searchRecipes(term);
//       if (category) recipes = recipes.filter(r => r.category === category);
//       if (difficulty) recipes = recipes.filter(r => r.difficulty === difficulty);
//     } else {
//       const result = await getRecipes({ category, difficulty, sort, pageSize: 12 });
//       recipes = result.recipes;
//     }

//     grid.innerHTML = '';
//     if (!recipes.length) {
//       grid.innerHTML = createEmptyState('fa-search', 'No recipes found', 'Try different filters or search terms.', 'Browse all', 'recipes.html');
//       return;
//     }
//     recipes.forEach(r => grid.appendChild(createRecipeCard(r)));
//   } catch (err) {
//     console.error(err);
//     grid.innerHTML = '<p class="text-muted text-center py-5">Could not load recipes. Check Firebase configuration.</p>';
//   }
// }

// document.getElementById('apply-filters').addEventListener('click', loadRecipes);
// searchInput.addEventListener('input', debounce(() => {
//   const wrap = searchInput.closest('.search-bar-wrap');
//   wrap.classList.toggle('has-value', searchInput.value.length > 0);
//   loadRecipes();
// }, 400));

// document.getElementById('clear-search').addEventListener('click', () => {
//   searchInput.value = '';
//   searchInput.closest('.search-bar-wrap').classList.remove('has-value');
//   loadRecipes();
// });

// loadRecipes();

import { initNavbar } from "../components/navbar.js";
import { initFooter } from "../components/footer.js";
import { createRecipeCard } from "../components/recipe-card.js";

import {
  getRecipes,
  searchRecipes,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "../firebase/firestore.js";

import { onAuthChange } from "../firebase/auth.js";

import { CATEGORIES, debounce, getQueryParam, showToast } from "../utils.js";

import { createLoader, createEmptyState } from "../components/loader.js";

initNavbar();
initFooter();

let currentUser = null;

// =========================
// AUTH STATE
// =========================
onAuthChange((user) => {
  currentUser = user;
});

// =========================
// ELEMENTS
// =========================
const grid = document.getElementById("recipes-grid");
const categorySelect = document.getElementById("filter-category");
const difficultySelect = document.getElementById("filter-difficulty");
const sortSelect = document.getElementById("filter-sort");
const searchInput = document.getElementById("search-input");

// =========================
// POPULATE CATEGORIES
// =========================
CATEGORIES.forEach((c) => {
  const opt = document.createElement("option");
  opt.value = c;
  opt.textContent = c;
  categorySelect.appendChild(opt);
});

// =========================
// PRE-SELECT CATEGORY
// =========================
const urlCat = getQueryParam("category");

if (urlCat) {
  categorySelect.value = urlCat;
}

// =========================
// LOAD RECIPES
// =========================
async function loadRecipes() {
  grid.innerHTML = "";
  grid.appendChild(createLoader());

  const category = categorySelect.value || null;
  const difficulty = difficultySelect.value || null;
  const sort = sortSelect.value;
  const term = searchInput.value.trim();

  try {
    let recipes;

    // =========================
    // SEARCH
    // =========================
    if (term) {
      recipes = await searchRecipes(term);

      if (category) {
        recipes = recipes.filter((r) => r.category === category);
      }

      if (difficulty) {
        recipes = recipes.filter((r) => r.difficulty === difficulty);
      }
    } else {
      // =========================
      // NORMAL RECIPES
      // =========================
      const result = await getRecipes({
        category,
        difficulty,
        sort,
        pageSize: 12,
      });

      recipes = result.recipes;
    }

    grid.innerHTML = "";

    // =========================
    // NO RECIPES
    // =========================
    if (!recipes.length) {
      grid.innerHTML = createEmptyState(
        "fa-search",
        "No recipes found",
        "Try different filters or search terms.",
        "Browse all",
        "recipes.html",
      );

      return;
    }

    // =========================
    // CREATE RECIPE CARDS
    // =========================
    for (const recipe of recipes) {
      let favorite = false;

      // Check favorite only if user is logged in
      if (currentUser) {
        favorite = await isFavorite(currentUser.uid, recipe.id);
      }

      const card = createRecipeCard(recipe, {
        showFav: true,

        isFav: favorite,

        onFavClick: async (recipeId, btnEl) => {
          // =========================
          // LOGIN CHECK
          // =========================
          if (!currentUser) {
            showToast(
              "Login Required",
              "Please login to save favorites.",
              "info",
            );

            return;
          }

          try {
            // =========================
            // REMOVE FAVORITE
            // =========================
            if (btnEl.classList.contains("active")) {
              await removeFavorite(currentUser.uid, recipeId);

              btnEl.classList.remove("active");

              btnEl.innerHTML = '<i class="far fa-heart"></i>';

              showToast("Removed", "Recipe removed from favorites.", "info");
            }

            // =========================
            // ADD FAVORITE
            // =========================
            else {
              await addFavorite(currentUser.uid, recipeId);

              btnEl.classList.add("active");

              btnEl.innerHTML = '<i class="fas fa-heart"></i>';

              showToast("Added", "Recipe added to favorites.", "success");
            }
          } catch (err) {
            console.error("Favorite error:", err);

            showToast("Error", err.message, "error");
          }
        },
      });

      grid.appendChild(card);
    }
  } catch (err) {
    console.error(err);

    grid.innerHTML =
      '<p class="text-muted text-center py-5">' +
      "Could not load recipes. Check Firebase configuration." +
      "</p>";
  }
}

// =========================
// FILTER BUTTON
// =========================
document.getElementById("apply-filters").addEventListener("click", loadRecipes);

// =========================
// SEARCH
// =========================
searchInput.addEventListener(
  "input",
  debounce(() => {
    const wrap = searchInput.closest(".search-bar-wrap");

    wrap.classList.toggle("has-value", searchInput.value.length > 0);

    loadRecipes();
  }, 400),
);

// =========================
// CLEAR SEARCH
// =========================
document.getElementById("clear-search").addEventListener("click", () => {
  searchInput.value = "";

  searchInput.closest(".search-bar-wrap").classList.remove("has-value");

  loadRecipes();
});

// =========================
// INITIAL LOAD
// =========================
loadRecipes();
