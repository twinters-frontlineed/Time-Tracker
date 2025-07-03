# Jira Time Tracker

A small, lightweight desktop overlay application for tracking time spent on Jira tickets. The app creates a small, always-on-top window that you can position anywhere on your screen.

## Features

- 🎯 **Always on top overlay** - Small window that stays visible over other applications
- 📝 **Jira ticket management** - Add and select from your Jira tickets
- ⏱️ **Timer functionality** - Start, stop, and reset timers for tracking work
- 💾 **Persistent data** - Your tickets and sessions are automatically saved
- 📍 **Position memory** - The app remembers where you positioned it
- 🎨 **Clean, minimal UI** - Designed to be unobtrusive

## Setup

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Usage

### Adding Tickets
1. Type a Jira ticket number in the format `ABC-123` in the input field
2. Click the `+` button or press Enter
3. The ticket will be added to the dropdown list

### Tracking Time
1. Select a ticket from the dropdown
2. Click `Start` to begin timing
3. Click `Stop` to end the session (automatically saves the time)
4. Click `Reset` to reset the current timer

### Window Management
- **Drag the window** - Click and drag the header area to move the window
- **Right-click** - Access context menu with options to close or reset position
- **Resize** - Drag the window edges to resize (the app remembers the size)

## File Structure

- `main.js` - Electron main process
- `preload.js` - Secure communication bridge
- `renderer.js` - Timer logic and UI interactions
- `index.html` - App interface
- `styles.css` - Styling and layout
- `package.json` - Project configuration

## Data Storage

The app uses `electron-store` to save:
- Your list of Jira tickets
- Time tracking sessions
- Window position and size
- Current timer state

Data is stored locally on your computer in:
- Windows: `%APPDATA%\jira-time-tracker\config.json`

## Building for Distribution

To create a distributable version:

```bash
npm run build
```

This will create an installer in the `dist` folder.

## Customization

You can easily customize the app by modifying:
- `styles.css` - Change colors, sizes, fonts
- `renderer.js` - Modify timer behavior or add features
- `main.js` - Adjust window properties or add system integration

## Troubleshooting

**App won't start:**
- Make sure Node.js is installed
- Run `npm install` to ensure all dependencies are installed

**Data not saving:**
- Check that the app has write permissions to the user data directory

**Window lost off-screen:**
- Right-click on the app and select "Reset Position"
