/**
 * Creates a recipe card HTML element
 */

import { renderStars, formatDate } from "../utils.js";

export function createRecipeCard(recipe, options = {}) {
  const {
    showFav = true,
    showActions = false,
    onFavClick = null,
    isFav = false,
  } = options;

  const img =
    recipe.imageUrl ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";
  const time = recipe.cookTime || recipe.prepTime || "—";
  const rating = recipe.ratingAvg || 0;

  const card = document.createElement("div");
  card.className = "col-sm-6 col-lg-4 col-xl-3";
  card.innerHTML = `
    <article class="card recipe-card h-100">
      <div class="recipe-card-img-wrap">
        <img src="${img}" alt="${recipe.title || "Recipe"}" class="recipe-card-img" loading="lazy">
        ${recipe.category ? `<span class="recipe-card-category">${recipe.category}</span>` : ""}
        ${
          showFav
            ? `
          <button class="recipe-card-fav ${isFav ? "active" : ""}" data-id="${recipe.id}" aria-label="Favorite">
            <i class="${isFav ? "fas" : "far"} fa-heart"></i>
          </button>`
            : ""
        }
      </div>
      <div class="recipe-card-body">
        <h3 class="recipe-card-title">
          <a href="recipe-detail.html?id=${recipe.id}">${recipe.title || "Untitled"}</a>
        </h3>
        <p class="recipe-card-desc">${recipe.description || ""}</p>
        <div class="recipe-card-meta">
          <span><i class="far fa-clock"></i> ${time} min</span>
          <span>${renderStars(rating)} ${rating ? rating.toFixed(1) : ""}</span>
        </div>
        <div class="recipe-card-footer">
          <div class="recipe-card-author">
            <i class="fas fa-user-circle"></i>
            <span>${recipe.authorName || "Chef"}</span>
          </div>
          ${
            showActions
              ? `
            <div class="d-flex gap-1">
              <a href="edit-recipe.html?id=${recipe.id}" class="btn btn-ghost btn-sm" title="Edit"><i class="fas fa-edit"></i></a>
              <button class="btn btn-ghost btn-sm btn-delete-recipe" data-id="${recipe.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>`
              : `
            <a href="recipe-detail.html?id=${recipe.id}" class="btn btn-outline btn-sm">View</a>
          `
          }
        </div>
      </div>
    </article>
  `;

  if (showFav && onFavClick) {
    card.querySelector(".recipe-card-fav")?.addEventListener("click", (e) => {
      e.preventDefault();
      onFavClick(recipe.id, e.currentTarget);
    });
  }

  return card;
}
