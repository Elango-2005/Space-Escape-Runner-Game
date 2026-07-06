# Space-Escape-Runner-Game

# 🚀 Space Escape

**Space Escape** is an action-packed arcade survival game where players pilot a spaceship to dodge an accelerating barrage of asteroids. Built with React Native & Expo, it features polished animations, dynamic difficulty, and custom audio for a AAA feel. Test your reflexes, manage your 3 lives, and beat your high score in quick, addictive play sessions!

![Space Escape Gameplay](https://via.placeholder.com/800x400?text=Insert+Gameplay+Screenshot+Here)

---

## ✨ Features

*   **🕹️ Classic Arcade Survival:** Dodge randomly generated falling asteroids to rack up points.
*   **📈 Dynamic Difficulty:** The speed of the falling meteors increases for every 30 points you score.
*   **❤️ Lives & Invincibility:** Start with 3 lives. Taking a hit triggers a particle explosion and grants a 2-second invincibility blink to recover.
*   **💾 Persistent Data:** High scores and audio preferences (Music/SFX toggles) are saved locally using `AsyncStorage`.
*   **🎵 Custom Audio Engine:** Integrated with the modern `expo-audio` package for seamless background music loops and crisp crash sound effects.
*   **🎨 AAA UI & Animations:** Built completely with React Native's `Animated` API—featuring a hovering title, flickering engine flames, and dynamic gradient space backgrounds.

---

## 🛠️ Tech Stack

*   **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (SDK 52+)
*   **Language:** TypeScript
*   **Routing:** Expo Router
*   **Storage:** `@react-native-async-storage/async-storage`
*   **Audio:** `expo-audio` & `expo-asset`
*   **Styling & UI:** `expo-linear-gradient`, `@expo/vector-icons`, `@expo-google-fonts/baloo-2`

---

## 📂 Project Structure

```text
SpaceEscapeRunner/
├── assets/
│   ├── audio/
│   │   ├── bgm.mp3      # Background music loop
│   │   └── crash.mp3    # Asteroid collision SFX
│   ├── images/
│   └── icon.png
├── src/
│   └── app/
│       └── index.tsx    # Main game logic and UI
├── app.json             # Expo configuration
├── package.json         # Dependencies
└── README.md
