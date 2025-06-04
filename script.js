 // Initialize Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyC-qDc2gyTze9L0bcaaR5Gy6Bw9pmbC6W0",
      authDomain: "nosql-demo-fa58e.firebaseapp.com",
      projectId: "nosql-demo-fa58e",
      storageBucket: "nosql-demo-fa58e.firebasestorage.app",
      messagingSenderId: "232544361594",
      appId: "1:232544361594:web:c229116ef0d49cb7dbafc3"
    };

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(app);

    // Global variables
    let allUsers = [];         // Store all users from Firebase
    let currentPage = 1;
    const entriesPerPage = 5;

    // DOM Elements
    const entriesContainer = document.getElementById('entriesList');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageIndicator = document.getElementById('pageIndicator');

    function showCustomAlert(title, message) {
      const modal = document.getElementById('customAlertModal');
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalMessage').innerText = message;
      modal.classList.add('visible');
    }

    document.getElementById('modalCloseButton').addEventListener('click', () => {
      document.getElementById('customAlertModal').classList.remove('visible');
    });

    // Submit Form
    const form = document.getElementById('userForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      
      try {
        // Add document to Firestore
        const docRef = await db.collection('users').add({
          name: data.name,
          email: data.email
        });
        
        showCustomAlert('✅ Success!', 'Data successfully saved!');
        form.reset();
        loadEntries(); // Refresh list
      } catch (error) {
        console.error('Error adding document: ', error);
        showCustomAlert('❌ Error!', 'Failed to save data: ' + error.message);
      }
    });

    // Load All Entries
    async function loadEntries() {
      entriesContainer.innerHTML = '<div class="no-entries">Loading entries...</div>';
      try {
        const snapshot = await db.collection('users').get();
        allUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        updateUI(); // Update UI with filtered/paginated results
      } catch (err) {
        console.error('Error fetching data:', err);
        entriesContainer.innerHTML = '<div class="no-entries" style="color:red;">Error loading data.</div>';
      }
    }

    // editEntry function
    async function editEntry(id, name, email) {
      const newName = prompt('Edit Name:', name);
      const newEmail = prompt('Edit Email:', email);

      if (newName === null || newEmail === null) return; // User canceled

      if (newName.trim() === '' || newEmail.trim() === '') {
          showCustomAlert('⚠ Invalid Input', 'Name and email cannot be empty.');
          return;
      }

      try {
        await db.collection('users').doc(id).update({
          name: newName,
          email: newEmail
        });
        
        showCustomAlert('✅ Updated!', 'Entry has been updated successfully.');
        loadEntries(); // Refresh list
      } catch (err) {
        console.error('Error updating entry:', err);
        showCustomAlert('⚠ Network Error', 'Could not connect to server. Please check your connection.');
      }
    }

    // deleteEntry function
    async function deleteEntry(id) {  
      // Confirm deletion
      const confirmDelete = confirm('Are you sure you want to delete this entry? This action cannot be undone.');
      if (!confirmDelete) return; // Exit if user cancels

      try {
        await db.collection('users').doc(id).delete();
        showCustomAlert('✅ Deleted!', 'Entry has been deleted successfully.');
        loadEntries(); // Refresh the entries list
      } catch (err) {
        console.error('Error deleting entry:', err);
        showCustomAlert('⚠ Network Error', 'Could not connect to server. Please check your connection.');
      }
    }

    // Update UI based on current filters and page
    function updateUI() {
      const searchTerm = searchInput?.value.trim().toLowerCase() || '';
      const filterType = filterSelect?.value || 'all';

      // Apply filter and search
      let filtered = [...allUsers];

      if (searchTerm) {
        filtered = filtered.filter(user => {
          const matchesName = user.name.toLowerCase().includes(searchTerm);
          const matchesEmail = user.email.toLowerCase().includes(searchTerm);

          if (filterType === 'all') return matchesName || matchesEmail;
          if (filterType === 'name') return matchesName;
          if (filterType === 'email') return matchesEmail;
        });
      }

      renderPaginatedEntries(filtered);
    }

    // Render paginated results
    function renderPaginatedEntries(filtered) {
      const totalPages = Math.ceil(filtered.length / entriesPerPage);
      currentPage = Math.min(Math.max(currentPage, 1), totalPages || 1);

      const start = (currentPage - 1) * entriesPerPage;
      const paginatedEntries = filtered.slice(start, start + entriesPerPage);

      // Clear list
      entriesContainer.innerHTML = '';

      if (paginatedEntries.length === 0) {
        entriesContainer.innerHTML = '<div class="no-entries">No matching entries found.</div>';
        updatePaginationControls(totalPages);
        return;
      }

      // Render each entry
      paginatedEntries.forEach(user => {
        const div = document.createElement('div');
        div.className = 'entry-item';
        div.innerHTML = `
          <div class="entry-info">
            <div class="entry-name">${user.name}</div>
            <div class="entry-email">${user.email}</div>
          </div>
          <div class="entry-actions">
            <button class="edit-button" onclick='editEntry("${user.id}", "${user.name}", "${user.email}")'>Edit</button>
            <button class="delete-button" onclick='deleteEntry("${user.id}")'>Delete</button>
          </div>
        `;
        entriesContainer.appendChild(div);
      });

      updatePaginationControls(totalPages);
    }

    // Update pagination buttons and indicator
    function updatePaginationControls(totalPages) {
      if (pageIndicator) {
        pageIndicator.textContent = `Page ${currentPage} of ${totalPages || 1}`;
      }
      if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
      }
      if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
      }
    }

    // Pagination button events
    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateUI();
        }
      });

      nextBtn.addEventListener('click', () => {
        currentPage++;
        updateUI();
      });
    }

    // Search and filter events
    if (searchInput && filterSelect) {
      searchInput.addEventListener('input', () => {
        currentPage = 1;
        updateUI();
      });

      filterSelect.addEventListener('change', () => {
        currentPage = 1;
        updateUI();
      });
    }

    // Initial load
    window.onload = loadEntries;