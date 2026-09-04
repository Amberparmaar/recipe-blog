export function initFooter() {
  const el = document.getElementById('footer-placeholder');
  if (!el) return;
  el.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="footer-brand">🍴 <span>Flavor</span>Verse</div>
            <p>Discover recipes worth sharing. Explore, create and savor culinary inspiration from food lovers around the world.</p>
          </div>
          <div class="col-6 col-md-2">
            <h5>Explore</h5>
            <a href="index.html">Home</a>
            <a href="recipes.html">Recipes</a>
            <a href="recipes.html?category=Dessert">Desserts</a>
            <a href="recipes.html?category=Healthy">Healthy</a>
          </div>
          <div class="col-6 col-md-2">
            <h5>Account</h5>
            <a href="login.html">Login</a>
            <a href="signup.html">Sign Up</a>
            <a href="my-recipes.html">My Recipes</a>
            <a href="favorites.html">Favorites</a>
          </div>
        
        </div>
        <div class="footer-bottom">
          &copy; ${new Date().getFullYear()} FlavorVerse. Made with ❤️ for food lovers.
        </div>
      </div>
    </footer>
  `;
}