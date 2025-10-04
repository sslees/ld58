# Paperboy: Time to Collect

A retro-styled browser game created for **Ludum Dare 58**. Ride your bike through a neighborhood and catch flying newspapers with your net before they pass you by!

**Compo Theme:** Collector

## Play the Game

Simply open `index.html` in your web browser - no server or build process required!

## How to Play

**Controls:**
- **▲/▼** or **W/S** - Move up and down
- **SPACE** - Swing your net to catch newspapers
- **ENTER** - Start/Restart game
- **ESC** - Pause

**Objective:**
Catch as many newspapers as possible! Each newspaper you miss costs a life. The game speeds up as your score increases, challenging your reflexes and timing.

**Scoring:**
- Regular newspaper: 10 points
- Newspaper bundle (rare): 100 points
- Current speed multiplier shown in HUD

## Features

- **Authentic Gameboy Aesthetic** - Classic 4-color green palette
- **Zero External Assets** - All graphics procedurally drawn with HTML5 Canvas
- **Progressive Difficulty** - Speed increases as you improve
- **Persistent High Score** - Tracks your best run using localStorage
- **Smooth Animations** - Rotating newspapers, scrolling scenery, animated net swings
- **Dynamic Environment** - Procedurally placed houses, trees, and clouds

## Technical Implementation

This game is built with vanilla web technologies:
- **Pure JavaScript (ES6+)** - No frameworks or libraries
- **HTML5 Canvas API** - All rendering done programmatically
- **CSS3** - Gameboy-inspired UI styling

The entire game runs client-side with no dependencies. Every visual element—from the bike rider to the houses—is drawn using Canvas paths and shapes, giving it that authentic retro feel.

## Development

This game was created for Ludum Dare 58 (theme: "Collector") using **Cursor** with **Claude Sonnet 4.5** doing the heavy lifting. The AI-assisted development process allowed rapid iteration on gameplay mechanics and visual polish within the jam timeframe.

The codebase is organized into clean classes:
- `Game` - Core game loop and state management
- `Player` - Bike rider with net mechanics
- `Newspaper` / `NewspaperStack` - Collectible objects
- `Background` - Scrolling neighborhood scenery
- `Particle` - Catch effects

## Tips for High Scores

- Stay near the center of the screen for maximum reach
- Anticipate newspaper spawns and position yourself early
- The net has a generous hitbox - you don't need pixel-perfect accuracy
- Time your swings! The net is most effective mid-swing
- Rare newspaper bundles are worth 10x points but don't cost a life if missed

## License

MIT License - Feel free to use, modify, and share!

