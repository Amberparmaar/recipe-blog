/**
 * Firestore CRUD helpers for recipes, favorites, ratings, comments
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  setDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const recipesCol = collection(db, "recipes");
const commentsCol = collection(db, "comments");
const ratingsCol = collection(db, "ratings");

/* ---------- RECIPES ---------- */

export async function createRecipe(data) {
  const docRef = await addDoc(recipesCol, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    views: 0,
    ratingAvg: 0,
    ratingCount: 0,
  });
  return docRef.id;
}

export async function getRecipe(id) {
  const snap = await getDoc(doc(db, "recipes", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateRecipe(id, data) {
  await updateDoc(doc(db, "recipes", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipe(id) {
  await deleteDoc(doc(db, "recipes", id));
}

export async function getRecipes({
  category,
  difficulty,
  sort = "newest",
  pageSize = 12,
  lastDoc = null,
} = {}) {
  let constraints = [];

  if (category) constraints.push(where("category", "==", category));
  if (difficulty) constraints.push(where("difficulty", "==", difficulty));

  if (sort === "newest") constraints.push(orderBy("createdAt", "desc"));
  else if (sort === "oldest") constraints.push(orderBy("createdAt", "asc"));
  else if (sort === "popular") constraints.push(orderBy("views", "desc"));
  else if (sort === "rating") constraints.push(orderBy("ratingAvg", "desc"));

  constraints.push(limit(pageSize));
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const q = query(recipesCol, ...constraints);
  const snap = await getDocs(q);
  const recipes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return { recipes, lastVisible: snap.docs[snap.docs.length - 1] || null };
}

export async function getRecipesByAuthor(authorId) {
  const q = query(
    recipesCol,
    where("authorId", "==", authorId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function incrementViews(id) {
  await updateDoc(doc(db, "recipes", id), { views: increment(1) });
}

export async function searchRecipes(term) {
  // Simple client-side filter after fetching recent recipes
  // For production, consider Algolia or Firestore extensions
  const { recipes } = await getRecipes({ pageSize: 50 });
  const lower = term.toLowerCase();
  return recipes.filter(
    (r) =>
      r.title?.toLowerCase().includes(lower) ||
      r.category?.toLowerCase().includes(lower) ||
      r.tags?.some((t) => t.toLowerCase().includes(lower)) ||
      r.ingredients?.some((i) => i.toLowerCase().includes(lower)),
  );
}

/* ---------- FAVORITES ---------- */

export async function addFavorite(uid, recipeId) {
  await setDoc(doc(db, "users", uid, "favorites", recipeId), {
    recipeId,
    addedAt: serverTimestamp(),
  });
}

export async function removeFavorite(uid, recipeId) {
  await deleteDoc(doc(db, "users", uid, "favorites", recipeId));
}

export async function isFavorite(uid, recipeId) {
  const snap = await getDoc(doc(db, "users", uid, "favorites", recipeId));
  return snap.exists();
}

export async function getFavorites(uid) {
  const snap = await getDocs(collection(db, "users", uid, "favorites"));
  const ids = snap.docs.map((d) => d.id);
  const recipes = [];
  for (const id of ids) {
    const r = await getRecipe(id);
    if (r) recipes.push(r);
  }
  return recipes;
}

/* ---------- RATINGS ---------- */

export async function rateRecipe(uid, recipeId, value) {
  const ratingId = `${uid}_${recipeId}`;
  const existing = await getDoc(doc(db, "ratings", ratingId));

  if (existing.exists()) {
    // Update existing rating - recalculate would need more complex logic
    await updateDoc(doc(db, "ratings", ratingId), {
      value,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(doc(db, "ratings", ratingId), {
      userId: uid,
      recipeId,
      value,
      createdAt: serverTimestamp(),
    });
    // Increment count & update average (simplified)
    const recipe = await getRecipe(recipeId);
    const newCount = (recipe.ratingCount || 0) + 1;
    const newAvg =
      ((recipe.ratingAvg || 0) * (recipe.ratingCount || 0) + value) / newCount;
    await updateDoc(doc(db, "recipes", recipeId), {
      ratingCount: newCount,
      ratingAvg: Math.round(newAvg * 10) / 10,
    });
  }
}

/* ---------- COMMENTS ---------- */

export async function addComment(data) {
  const ref = await addDoc(commentsCol, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getComments(recipeId) {
  try {
    const q = query(commentsCol, where("recipeId", "==", recipeId));

    const snap = await getDocs(q);

    const comments = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Newest comments first
    comments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);

      return dateB.getTime() - dateA.getTime();
    });

    return comments;
  } catch (error) {
    console.error("❌ getComments error:", error);
    throw error;
  }
}

export async function deleteComment(commentId) {
  await deleteDoc(doc(db, "comments", commentId));
}

/* ---------- USER PROFILE ---------- */

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

/* ---------- ADMIN / USERS ---------- */

export async function getAllUsers(pageSize = 10, lastDoc = null) {
  let constraints = [orderBy("createdAt", "desc"), limit(pageSize)];

  if (lastDoc) {
    constraints = [
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize),
    ];
  }

  const q = query(collection(db, "users"), ...constraints);

  const snap = await getDocs(q);

  const users = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return {
    users,
    lastVisible: snap.docs[snap.docs.length - 1] || null,
  };
}
