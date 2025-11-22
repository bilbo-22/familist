# Familist

**Familist** is a modern, real-time shared list application designed for couples and families. It allows users to collaborate on shopping lists, chores, and plans instantly across devices.

## ✨ Key Features

-   **Real-time Collaboration**: Updates appear instantly on all connected devices using Socket.io.
-   **AI-Powered Audio Input**: Dictate your list items! Uses **Google Gemini AI** to intelligently extract items from your voice notes.
-   **Drag & Drop**: Easily reorder items with a smooth drag-and-drop interface.
-   **Dark Mode**: Beautifully designed UI with seamless light and dark mode switching.
-   **Multiple Lists**: Create and manage separate lists for different needs.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, TailwindCSS, Lucide Icons
-   **Backend**: Node.js, Express, Socket.io
-   **AI**: Google Gemini API (via `@google/genai`)

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd familist
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your keys:
    ```env
    GEMINI_API_KEY=your_api_key_here
    VITE_APP_PASSWORD=your_secure_password # Defaults to 'admin' if not set
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```
    This will start both the frontend (Vite) and the backend server concurrently.
    -   Frontend: `http://localhost:5173`
    -   Backend: `http://localhost:3000`

## 📦 Deployment

This project is configured for deployment on **Google Cloud App Engine** or **VPS with Docker**.

-   See [DEPLOY.md](./DEPLOY.md) for Google Cloud.
-   See [VPS_DEPLOY.md](./VPS_DEPLOY.md) for VPS/Docker.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
