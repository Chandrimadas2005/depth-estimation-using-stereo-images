# Depth Estimation Using Stereo Images
# 🎯 StereoVision Pro: Auto-Depth Estimator

A high-performance web application that calculates object **depth and distance** using stereo image pairs (Left/Right) and camera metadata (EXIF).
It features a **React-based dashboard** and a **Flask-powered computer vision engine**.

---

## 🚀 Features

* 🎯 **Stereo Matching Engine**
  Uses Semi-Global Block Matching (**SGBM**) to generate accurate disparity maps.

* 📸 **Auto-EXIF Parsing**
  Automatically extracts focal length and sensor data from uploaded images.

* 🌈 **Interactive Heatmaps**
  Visualizes depth variations across the field of view.

* 💻 **Professional Dashboard**
  Dark-themed, responsive UI built with **React + Tailwind CSS**.

* 📊 **Real-time Analytics**
  Displays Z-depth, focal length equivalents, and crop factors.

---

## 📂 Project Structure

```
stereo-vision-app/
├── backend/
│   ├── app.py             # Flask API & Computer Vision Logic
│   └── static/uploads/    # Temporary storage for processed images
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main Dashboard UI
│   │   ├── index.css      # Tailwind & Global Styles
│   │   └── main.jsx       # React Entry Point
│   ├── tailwind.config.js # Styling Configuration
│   └── package.json       # Frontend Dependencies
└── README.md
```

---

## 🛠️ Installation & Setup

### 🔹 Backend (Python/Flask)

```bash
cd backend
pip install flask flask-cors opencv-python numpy Pillow reportlab matplotlib
python app.py
```

➡️ Server will run at: http://127.0.0.1:5000

---

### 🔹 Frontend (React/Vite)

```bash
cd frontend
npm install
npm install lucide-react
npm run dev
```

➡️ UI will run at: http://localhost:5173

---

## 🧪 How It Works

### 1️⃣ Upload

User uploads **Left & Right stereo images**

### 2️⃣ Baseline

User inputs the **distance between camera lenses (in meters)**

### 3️⃣ Processing

* Images converted to grayscale
* **SGBM algorithm** computes disparity (pixel shift)
* Depth is calculated using:

```
Depth = (Focal_Px × Baseline) / Disparity
```

### 4️⃣ Visualization

* Heatmap generated using **Matplotlib (magma colormap)**
* Sent back to the React dashboard

---

## 📋 Requirements

* Python 3.8+
* Node.js 16+
* Stereo Image Pair (with clear features & known baseline)

---

## ✨ Future Improvements

* 📦 Export depth maps as downloadable files
* ⚡ GPU acceleration (CUDA/OpenCV)
* 📷 Live stereo camera support
* 📐 3D point cloud visualization

---

## 📄 License

This project is proprietary and confidential. Unauthorized use, copying, or distribution is strictly prohibited. Internal / proprietary — Calsoft Pvt Ltd.

---

## 💡 Author
**Chandrima Das**
**Bratati Basu**

