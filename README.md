# Ji## Features

- 🎯 **Configurable Overlay Interface**: Compact window with optional always-on-top behavior for uninterrupted workflow
- 🔗 **Jira Integration**: Automatically syncs your assigned "In Progress" tickets via Jira REST API
- ⏱️ **Time Tracking**: Start, stop, and reset timers with intuitive icon-based controls
- 🎨 **Modern UI**: Clean interface with Frontline Education branding
- 💾 **Persistent Settings**: Remembers window position, Jira configuration, and window behavior preferences
- 📱 **Responsive Design**: Icon-based controls optimized for small screens
- 🔄 **Real-time Sync**: Visual sync status indicators with success/error feedbackracker

A lightweight Electron overlay application for tracking time spent on Jira tickets. Features a compact, always-on-top interface that integrates directly with your Jira instance to sync assigned tickets and track work time.

## Features

- 🎯 **Overlay Interface**: Compact, always-on-top window that doesn't interfere with your workflow
- � **Jira Integration**: Automatically syncs your assigned "In Progress" tickets via Jira REST API
- ⏱️ **Time Tracking**: Start, stop, and reset timers with intuitive icon-based controls
- 🎨 **Modern UI**: Clean interface with Frontline Education branding
- � **Persistent Settings**: Remembers window position and Jira configuration
- 📱 **Responsive Design**: Icon-based controls optimized for small screens
- 🔄 **Real-time Sync**: Visual sync status indicators with success/error feedback

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Jira Account** with API access
- **Windows, macOS, or Linux**

## Installation

### Option 1: Download Pre-built Release
*(Coming soon - check the Releases page)*

### Option 2: Build from Source

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd "Time Tracker"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm start
   ```

## Building Executables

### Windows Portable Executable
```bash
npm run build:win
```
This creates a portable `.exe` file in the `dist` folder that can be shared without installation.

### Cross-platform Builds
```bash
# Windows installer
npm run build:win-installer

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

**Note for Windows builds**: You may need to run the build command as Administrator due to code signing and symlink requirements.

## Configuration

### First-time Setup

1. **Launch the application**
2. **Click the Settings button** (⚙ icon) in the top-right corner
3. **Configure your Jira connection**:
   - **Jira URL**: Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
   - **Email**: Your Jira account email
   - **API Token**: Generate from your Jira Account Settings → Security → API Tokens
   - **Projects**: Comma-separated project keys (e.g., `PROJ1,PROJ2`)

4. **Configure window behavior**:
   - **Always stay on top**: Check this option to keep the time tracker above all other windows (recommended for overlay use)
   - Uncheck if you prefer the window to behave like a normal application window

5. **Test the connection** using the "Test Connection" button
6. **Save settings**

### Getting a Jira API Token

1. Go to your Jira Account Settings
2. Navigate to **Security** → **API Tokens**
3. Click **Create API Token**
4. Give it a descriptive name (e.g., "Time Tracker App")
5. Copy the generated token and paste it into the app settings

## Usage

### Basic Workflow

1. **Sync Tickets**: Click the sync button (↻) to fetch your assigned "In Progress" tickets
2. **Select Ticket**: Choose a ticket from the dropdown menu
3. **Start Tracking**: Click the play button (▶) to start the timer
4. **Work**: The timer runs in the background while you work
5. **Stop/Pause**: Click the stop button (◼) to pause timing
6. **Reset**: Click the reset button (↻) to reset the timer to 00:00:00

### Interface Elements

- **Header**: 
  - App title and drag handle for moving the window
  - Settings (⚙), Sync (↻), and Close (×) buttons
- **Ticket Selection**: Dropdown showing synced Jira tickets
- **Timer Display**: Shows elapsed time in HH:MM:SS format
- **Controls**: Icon-based start, stop, and reset buttons
- **Notifications**: Status messages for sync operations and errors

### Keyboard Shortcuts

- **Drag Window**: Click and drag the header area
- **Resize Window**: Drag from any edge (window is resizable)

### Tips

- The window position is automatically saved and restored
- Sync status is indicated by the sync button icon (spinning during sync)
- Only tickets in "In Progress" status are synced
- The app validates window position on startup to handle disconnected displays
- Timer continues running even if you switch between tickets

## Troubleshooting

### Common Issues

**"Connection failed" when testing Jira settings**
- Verify your Jira URL is correct and accessible
- Ensure your email and API token are valid
- Check that your account has access to the specified projects

**No tickets appear after sync**
- Ensure you have tickets assigned to you in "In Progress" status
- Verify the project keys in settings match your actual Jira projects
- Check that your account has permission to view the projects

**App opens on wrong screen or off-screen**
- The app automatically validates window position on startup
- If issues persist, close the app and it will reset to default position

**Build fails on Windows**
- Try running the build command as Administrator
- Ensure you have the latest version of Node.js installed

### Development

**Running in development mode**
```bash
npm start
```

**Enable developer tools**
Uncomment the following line in `main.js`:
```javascript
// mainWindow.webContents.openDevTools();
```

## Technical Details

### Architecture
- **Frontend**: HTML, CSS, JavaScript with Electron renderer process
- **Backend**: Node.js with Electron main process
- **Storage**: electron-store for persistent configuration
- **API**: Axios for Jira REST API communication

### File Structure
```
Time Tracker/
├── main.js          # Electron main process
├── renderer.js      # Frontend logic and Jira integration
├── preload.js       # Secure IPC bridge
├── index.html       # App interface
├── styles.css       # UI styling
├── package.json     # Dependencies and build config
└── README.md        # This file
```

### Security
- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- API credentials stored encrypted via electron-store

## Data Storage

The app uses `electron-store` to save:
- Jira connection settings (URL, email, API token, projects)
- Window position and size
- Current timer state

Data is stored locally on your computer in:
- **Windows**: `%APPDATA%\jira-time-tracker\config.json`
- **macOS**: `~/Library/Application Support/jira-time-tracker/config.json`
- **Linux**: `~/.config/jira-time-tracker/config.json`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions:
- Check the troubleshooting section above
- Review existing issues in the repository
- Create a new issue with detailed information about your problem

---

**Built with ❤️ for productivity and time tracking**
