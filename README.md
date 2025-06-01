# PUMP.FUN Defense

A pixel-art web game inspired by Plants vs. Zombies first mission, adapted with a crypto-degen theme. This game is a visual clone of PvZ with the same mechanics but crypto-themed characters.

## How to Run
Simply open `index.html` in any modern browser. No additional setup required.

## Game Instructions
1. Click the **Play** button to start the game
2. Select a token from the bottom panel (ASSDAQ, Chill House, Donald Glonk, Pig)
3. Place tokens on the grid to defend your Launchpad
4. Collect currency drops that appear randomly on the grid
5. Prevent zombies (BEAR, WOJAK, PEPE) from reaching your Launchpad

## Features
- **Authentic PvZ Layout**: 5×9 grid battlefield with the same visual structure as the original game
- **Launchpad**: Your base on the left side that must be protected
- **Four Playable Tokens**: 
  - ASSDAQ (50) - HP: 10, Damage: 15
  - Chill House (100) - HP: 30, Damage: 10
  - Donald Glonk (125) - HP: 100, Damage: 0 (Defender)
  - Pig (25) - HP: 10, Damage: 5
- **Three Locked Slots**: Shown with lock icons
- **Crypto Zombies**: Three types with varying health and speed:
  - Zombie 1: HP: 50, Damage: 5 (Slow, spawns up to 12 times)
  - Zombie 2: HP: 60, Damage: 7 (Fast, spawns up to 6 times)
  - Zombie 3: HP: 100, Damage: 10 (Medium speed, spawns up to 4 times)
- **Currency System**: Collect currency to place more tokens
- **Shovel Tool**: Remove placed tokens
- **Cooldown Timers**: Each token has a cooldown period before it can be placed again
- **Game Over Screen**: "YOU ARE RUGGED!!!" message when zombies reach your Launchpad

## Visual Style
- Pixel art graphics for all game elements
- Dark theme with crypto aesthetics
- PvZ-inspired UI layout

## Tech Stack
- HTML + CSS (pixel art style)
- Vanilla JavaScript

## Assets
The game uses the following assets:
- `assets/grass.png`, `assets/grass_2.png`, `assets/grass_3.png`: Трава для игрового поля
- `assets/plants/ASSDAQ.png`: Токен ASSDAQ
- `assets/plants/Chill_House.png`: Токен Chill House
- `assets/plants/Donald_Glonk.png`: Токен Donald Glonk
- `assets/plants/pig.png`: Токен Pig
- `assets/launchpad.png`: Изображение базы
- Zombie images: `bear.png`, `wojak.png`, `pepe.png` (пока не реализованы)
- `coin.png`: Валюта (пока не реализована)

Feel free to expand the game with Phaser.js or Pixi.js for more advanced features.
