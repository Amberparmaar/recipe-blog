
import { 
  collection, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "../firebase/firebase-config.js";
 
let getUser = async () => {
    try {
        // Show loading state
        const tableBody = document.getElementById("userTableBody");
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">⏳ Loading users...</td></tr>';
 
        // Get real-time updates from Firestore
        let userRef = collection(db, "users");
 
        onSnapshot(userRef, (querySnapshot) => {
            const _users = [];
            querySnapshot.forEach((doc) => {
                _users.push({ ...doc.data(), id: doc.id });
            });
 
            // Update global users array
            users = _users;
            filteredUsers = [...users];
            
            // Update table with data
            renderTable();
            
            // Log for debugging
            console.log(`✅ Successfully loaded ${_users.length} users`);
        });
    } catch (error) {
        console.error("❌ Error loading users:", error);
        const tableBody = document.getElementById("userTableBody");
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; color: red; padding: 20px;">
                    ❌ Error loading users: ${error.message}
                </td>
            </tr>
        `;
    }
}
 
// ============== Update Status ==============
 
let updateStatus = async (uid, currentStatus) => {
    try {
        let status = currentStatus === 'true' || currentStatus === true;
 
        await updateDoc(doc(db, "users", uid), {
            isActive: !status
        });
 
        console.log(`✅ User status updated for: ${uid}`);
 
    } catch (error) {
        console.error("❌ Error updating status:", error);
        alert(`Failed to update status: ${error.message}`);
    }
}
 
// ============== Data Management ==============
 
let currentPage = 1;
const rowsPerPage = 10;  // ✅ FIXED: Changed from 1 to 10
let users = [];
let filteredUsers = [...users];
 
const tableBody = document.getElementById("userTableBody");
const searchInput = document.getElementById("searchInput");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("pageIndicator");
 
// ============== Event Listeners ==============
 
// Event delegation for status button
tableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('status-btn')) {
        let id = e.target.getAttribute('data-id');
        let currentStatus = e.target.getAttribute('currentStatus');
        updateStatus(id, currentStatus);
    }
});
 
// Search filter
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    filteredUsers = users.filter(user => {
        const name = user.name ? user.name.toLowerCase() : '';
        const email = user.email ? user.email.toLowerCase() : '';
        return name.includes(query) || email.includes(query);
    });
    currentPage = 1;
    renderTable();
});
 
// Pagination - Previous button
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});
 
// Pagination - Next button
nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});
 
// ============== Render Table ==============
 
function renderTable() {
    tableBody.innerHTML = "";
 
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedUsers = filteredUsers.slice(start, end);
 
    if (paginatedUsers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding: 20px; color: #999;">
                    📭 No users found
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }
 
    paginatedUsers.forEach(user => {
        const row = document.createElement("tr");
        
        // ✅ FIXED: Correct status display logic
        const isActive = user.isActive === true || user.isActive === 'true';
        const statusClass = isActive ? 'active' : 'inactive';
        const statusText = isActive ? '✅ Active' : '❌ Blocked';
        
        row.innerHTML = `
            <td>${user.id || 'N/A'}</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.role || 'User'}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>
                <button 
                    class="status-btn" 
                    data-id="${user.id}" 
                    currentStatus="${isActive}"
                    title="Click to toggle user status"
                >
                    Toggle
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
 
    updatePagination();
    console.log(`📊 Displayed ${paginatedUsers.length} of ${filteredUsers.length} users (Page ${currentPage})`);
}
 
// ============== Update Pagination ==============
 
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage) || 1;
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
 
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}
 
// ============== Initialize ==============
 
console.log("🚀 Initializing users page...");
 
// Initial render (empty, waiting for data)
renderTable();
 
// Fetch users from Firestore
getUser();
 
console.log("✅ Users page initialization complete");
 