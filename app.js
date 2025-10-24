// ============================
// 🔐 AUTHENTICATION FUNCTIONS
// ============================

// Signup
async function signup(event) {
  event.preventDefault();
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    alert("Signup successful!");
    window.location.href = "login.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Login
async function login(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    alert("Login successful!");
    window.location.href = "all-items.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Logout
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "login.html";
  });
}

// ============================
// 🔥 FIREBASE SETUP
// ============================

const db = firebase.firestore();
const storage = firebase.storage();

// ============================
// 📦 ADD LOST / FOUND ITEMS
// ============================

async function addItem(event, type) {
  event.preventDefault();

  const title = document.getElementById("itemTitle").value;
  const description = document.getElementById("itemDescription").value;
  const place = document.getElementById("itemPlace").value;
  const imageFile = document.getElementById("itemImage").files[0];
  const user = firebase.auth().currentUser;

  if (!user) {
    alert("Please login first!");
    return;
  }

  try {
    // Upload image to Firebase Storage
    const storageRef = storage.ref("items/" + imageFile.name);
    await storageRef.put(imageFile);
    const imageUrl = await storageRef.getDownloadURL();

    // Save item to Firestore
    await db.collection("items").add({
      title,
      description,
      place,
      imageUrl,
      type, // 'lost' or 'found'
      userId: user.uid,
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(type.toUpperCase() + " item added successfully!");
    window.location.href = "all-items.html";
  } catch (error) {
    alert("Error adding item: " + error.message);
  }
}

// ============================
// 📋 DISPLAY ALL ITEMS
// ============================

function loadItems() {
  const itemsContainer = document.getElementById("itemsList");

  db.collection("items")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      itemsContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const item = doc.data();
        const card = `
          <div class="item-card">
            <img src="${item.imageUrl}" alt="Item Image" />
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <p><strong>Place:</strong> ${item.place}</p>
            <p><strong>Type:</strong> ${item.type}</p>
            <button onclick="viewItem('${doc.id}')">View Details</button>
          </div>
        `;
        itemsContainer.innerHTML += card;
      });
    });
}

// ============================
// 🔎 VIEW ITEM DETAILS
// ============================

function viewItem(id) {
  localStorage.setItem("selectedItemId", id);
  window.location.href = "item-detail.html";
}

async function loadItemDetails() {
  const id = localStorage.getItem("selectedItemId");
  if (!id) return;

  const doc = await db.collection("items").doc(id).get();
  if (doc.exists) {
    const item = doc.data();
    document.getElementById("detailTitle").innerText = item.title;
    document.getElementById("detailImage").src = item.imageUrl;
    document.getElementById("detailDescription").innerText = item.description;
    document.getElementById("detailPlace").innerText = item.place;
    document.getElementById("detailType").innerText = item.type;
    document.getElementById("detailContact").innerText = item.email;
  }
}

// ============================
// 👥 AUTH STATE HANDLER
// ============================

firebase.auth().onAuthStateChanged((user) => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    if (user) {
      logoutBtn.style.display = "block";
    } else {
      logoutBtn.style.display = "none";
    }
  }
});

// ============================
// 🧹 ESCAPE HTML (for safety)
// ============================

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[&<"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", '"': "&quot;", "'": "&#039;" }[m]));
}
