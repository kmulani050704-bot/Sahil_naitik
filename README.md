# CloudVault ☁️

CloudVault is a responsive, client-side UI prototype for a cloud file storage web application. Built entirely with Vanilla JavaScript, HTML5, and CSS3, it demonstrates modern file management interactions, state management, and DOM manipulation without relying on a backend server. 

Data persistence is simulated using the browser's `localStorage` API.

## 🚀 Features

* **Authentication UI:** Mock login screen with validation.
* **Dashboard & Metrics:** Visual representation of storage usage and file categorization (Images, Documents, etc.).
* **File Management:** 
  * Drag-and-drop file uploads (simulated via Base64 `FileReader`).
  * Create, open, and navigate folders.
  * Rename, delete, and download files.
* **Trash System:** Soft-delete functionality allowing users to restore files or permanently empty the trash.
* **Search & Filters:** Real-time filtering by file type (Images, Videos, Documents, Archives) and sorting by date, name, or size.
* **Share Links:** Generate mock sharing tokens and URLs for individual files.
* **Theming:** Persistent Light and Dark mode toggle.
* **Responsive Design:** Fully mobile-optimized layout with off-canvas sidebar navigation.

## 📁 Project Structure

The project has been modularized for maintainability:

```text
├── index.html    # Core markup and application layout
├── styles.css    # Base styling, UI components, and CSS animations
├── media.css     # Responsive breakpoints and mobile layout adjustments
└── script.js     # State management, routing, and business logic
```



## 🛠️ Getting Started

Because this is a client-side only application, there are no build tools, dependencies, or server requirements.

1. **Clone the repository:**
   \`\`\`bash
   (https://github.com/kmulani050704-bot/Sahil_naitik)
   \`\`\`
2. **Open the app:**
   Simply double-click the `index.html` file to open it in any modern web browser, or serve it using a local development server like VS Code's Live Server.

## 🔐 Demo Credentials

To bypass the login screen, use the following mock credentials:
* **Username:** `admin`
* **Password:** `admin123`

## ⚠️ Technical Limitations & Disclaimers

**This is a front-end UI prototype, not a production-ready storage solution.** 

* **Storage Quotas:** While the UI displays a 5GB storage limit, the application relies on `localStorage` to save file data. Most modern browsers cap `localStorage` at ~5MB. Attempting to upload large files (like high-res videos) will result in a `QuotaExceededError` and crash the state.
* **Data Persistence:** Clearing your browser cache or `localStorage` will permanently delete all uploaded files and folders.
* **Security:** The login mechanism is strictly for demonstration purposes and provides zero actual security.

## 💻 Technologies Used

* **HTML5:** Semantic structure and File API.
* **CSS3:** Flexbox, CSS Grid, Custom Properties (Variables), and Keyframe Animations.
* **Vanilla JavaScript (ES6+):** Array manipulation, Event Delegation, `localStorage` API, and `FileReader` API.
