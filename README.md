# Paper Catcher 🚴📰

A retro-styled browser game inspired by classic Gameboy aesthetics! Ride your bike through a neighborhood and catch flying newspapers with your net.

## 🎮 How to Play

- **↑/↓ or W/S**: Move up and down
- **SPACE**: Swing your net to catch newspapers
- **Goal**: Catch as many newspapers as possible! Missing a newspaper ends the game.

The game gets progressively faster as your score increases!

## 🚀 Running the Game

### Play Locally

Simply open `index.html` in your web browser. No server or build process required!

### Deploy to GitHub Pages

1. **Initialize a Git repository** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Paper Catcher game"
   ```

2. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name your repository (e.g., `paper-catcher`)
   - Don't initialize with README (you already have one)

3. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click "Settings"
   - Scroll down to "Pages" in the left sidebar
   - Under "Source", select "main" branch
   - Click "Save"
   - Your game will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

## 🎨 Features

- **Retro Gameboy Aesthetic**: Classic green palette and pixelated style
- **Procedurally Generated Graphics**: All artwork created with canvas drawing - no external assets!
- **Scrolling Background**: Dynamic neighborhood with houses, trees, and clouds
- **Progressive Difficulty**: Game speed increases as you play
- **High Score Tracking**: Saves your best score using localStorage
- **Responsive Design**: Adapts to different screen sizes

## 🛠️ Technical Details

Built with:
- Pure JavaScript (ES6+)
- HTML5 Canvas for rendering
- CSS3 for UI styling
- No external libraries or frameworks
- No image files - all graphics drawn programmatically

## 📝 Game Mechanics

- Newspapers spawn randomly at different heights
- Use the net to catch them before they scroll off screen
- Missing a newspaper ends the game
- Score increases by 10 points for each catch
- Game speed gradually increases over time

## 🎯 Tips

- Keep moving! Stay in the middle of the screen to reach newspapers in any direction
- Swing your net early - timing is key!
- Watch for patterns in newspaper spawns
- The net has a decent range, so don't worry about being pixel-perfect

## 📜 License

Feel free to use, modify, and share this game!

---

Made with ❤️ for the joy of retro gaming

