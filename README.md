# 🎴 Card Game PWA

A mobile-first Progressive Web App for drawing and organizing playing cards by suit. Built with Bootstrap 5 and vanilla JavaScript.

## Features

- 📱 Mobile-first responsive design
- 🎯 Draw 13 random cards from a standard 52-card deck
- ♠️♥️♦️♣️ Cards automatically grouped and sorted by suit
- 🔢 Real-time card count for each suit
- 💾 PWA capabilities (offline support, installable)
- ⚡ Fast and lightweight
- 🎨 Beautiful gradient background and smooth animations

## Card Sorting Logic

- Cards are grouped by suit (Spades, Hearts, Diamonds, Clubs)
- Within each suit, cards are sorted from highest to lowest:
  - Ace (highest)
  - King, Queen, Jack
  - 10, 9, 8, 7, 6, 5, 4, 3
  - 2 (lowest)

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5.3.2
- Service Workers for PWA functionality

## Deployment to GitHub Pages

### Method 1: Using GitHub Web Interface

1. Create a new repository on GitHub
2. Upload all files (`index.html`, `styles.css`, `app.js`, `manifest.json`, `service-worker.js`)
3. Go to repository Settings → Pages
4. Under "Source", select "Deploy from a branch"
5. Select the `main` branch and `/ (root)` folder
6. Click Save
7. Your site will be available at: `https://[username].github.io/[repository-name]/`

### Method 2: Using Git Commands

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Card Game PWA"

# Add your GitHub repository as remote
git remote add origin https://github.com/[username]/[repository-name].git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in your repository settings as described in Method 1, steps 3-7.

## Local Development

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8000`

## PWA Installation

When deployed, users can install the app on their devices:

- **Mobile (iOS)**: Tap Share → Add to Home Screen
- **Mobile (Android)**: Tap Menu → Install App
- **Desktop**: Look for the install icon in the address bar

## File Structure

```
card-game-pwa/
├── index.html          # Main HTML file
├── styles.css          # Custom styles
├── app.js              # Game logic and UI controller
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline support
└── README.md          # This file
```

## Customization

### Change Number of Cards

In `app.js`, modify the `drawCards()` call:

```javascript
this.game.drawCards(13); // Change 13 to any number between 1-52
```

### Modify Colors

In `styles.css`, update the CSS variables:

```css
:root {
    --spades-color: #000000;
    --hearts-color: #dc3545;
    --diamonds-color: #0d6efd;
    --clubs-color: #198754;
}
```

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use and modify as needed!

## Note on Icons

For a complete PWA experience, you'll need to create icon images:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

You can create these using any image editor or online tools like [favicon.io](https://favicon.io/) or [realfavicongenerator.net](https://realfavicongenerator.net/).
