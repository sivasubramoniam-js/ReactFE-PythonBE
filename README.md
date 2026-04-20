# 🦸‍♂️ ComicCrafter: AI & Open Peeps Comic Story Builder

> **"Bring your stories to life with drag-and-drop ease, hand-drawn characters, and smart canvas editing."**

ComicCrafter is a full-stack platform built with React, Fabric.js, and Python/Flask that allows anyone to easily create custom comic strips. By integrating the **Open Peeps** library, users can customize characters with different faces, bodies, and expressions, place them in a scene, add speech bubbles with handwriting fonts, and publish their comics.

---

## 🎯 The Vision

Creating comics traditionally requires heavy illustration skills or clunky software. ComicCrafter makes it accessible to everyone by providing:
1. **A modular character system** (Open Peeps) where you just pick "Happy", "Sitting", "Glasses".
2. **A powerful visual editor** that handles drag, drop, scale, rotate, and layers.
3. **Comic-specific tools** like speech bubbles, thought clouds, and handwriting-style typography.

---

## 🧠 Brainstorming Core Features

### 1. 🎨 The Canvas Storyboard (Frontend - Fabric.js)
- Multi-panel support (e.g., 3-panel classic comic strip format or freeform canvas).
- Interactive object manipulation: click to select, drag to move, resize boxes with handles, rotate elements.
- Export canvas to PNG/JPEG or save the raw JSON representation to the backend to edit later.

### 2. 👤 Open Peeps Character Builder
- **Sidebar Dropdowns** to configure your character:
  - **Skin Tone & Clothing Color** picker.
  - **Body / Pose**: Standing, Sitting, Pointing, Walking, etc.
  - **Head / Hair**: Short, Long, Afro, Buns, Hat, etc.
  - **Face / Expression**: Happy, Sad, Angry, Surprised, Cheeky.
  - **Accessories**: Glasses, Mask.
- Clicking "Add Character" injects the composed SVG directly into the canvas.

### 3. 💬 Comic Elements & Text
- Pre-made SVG assets for **Speech Bubbles** (talk, shout, whisper) and **Thought Clouds**.
- Text tool configured to use **Handwriting Google Fonts** (e.g., *Comic Neue*, *Architects Daughter*, *Indie Flower*) to give it that authentic comic book feel.
- Ability to double-click text to edit.

### 4. 🏞️ Environments & Props
- Basic background colors or preset scenes (e.g., office, park, bedroom).
- Simple props (desk, laptop, coffee cup) to give context to the characters.

### 5. 🗄️ Backend Storage (Python / Flask)
- Provide a simple REST API to save comics (Title, Author, Fabric Canvas JSON payload, and base64 preview image).
- Gallery endpoint to view all comics created by users.

### 6. 🤖 AI Comic Assistant (Optional Future Enhancement)
- *Writer's Block?* Tell Gemini "Write a 3-panel joke about software engineers" and let the AI generate the dialogue text for the bubbles.

---

## 🏗️ Tech Stack

### Frontend (React)
- **Framework:** React / react-router
- **Canvas Engine:** `fabric.js` (Perfect for handling drag/drop, text, SVGs, and object grouping)
- **Characters:** `react-peeps` or direct Open Peeps SVG integration
- **Styling:** CSS variables, minimalist UI inspired by modern design tools (Figma-lite)
- **Fonts:** WebFontLoader for Google Handwriting fonts

### Backend (Python)
- **Framework:** Flask (REST API)
- **Database:** SQLite (Stores comic metadata, JSON canvas states, and base64 thumbnails)
- **Dependencies:** `flask-cors`, `sqlite3`

---

## 🚀 Execution Plan (MVP Build Order)

| Phase | Description | Key Deliverables |
|---|---|---|
| **Phase 1** | **Canvas Foundation** | Setup React + Fabric.js. Ability to add shapes, text, drag, resize, and delete. Load Google Handwriting fonts. |
| **Phase 2** | **Open Peeps Integration** | Build the Character Creator sidebar. Dropdowns for Head/Face/Body. Generate combined SVG and push to Fabric.js canvas. |
| **Phase 3** | **Comic Assets** | Add Speech bubbles, backgrounds, and ability to layer objects (send to back, bring to front). |
| **Phase 4** | **Backend Gallery** | Flask API to Save/Load the Fabric object JSON. Build a gallery page to view published strips. |

---

## ❓ Open Questions & Next Steps

1. **Open Peeps Assets**: Should we use the NPM package `react-peeps` to render them on screen, and then convert that DOM node to an image for the canvas? Or should we download the raw SVGs and combine them mathematically inside the canvas? *(Converting a React component to a canvas image is usually the simplest route).*
2. **Panel Structure**: Do you want a strict "grid" of panels (like a newspaper comic), or a free-form single large canvas where the user can just draw black square panels as backgrounds?

*Let me know your thoughts on this direction, and I can start laying down the foundational code for Phase 1!*
