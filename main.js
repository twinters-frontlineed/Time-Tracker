const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 280,
    height: 140,
    frame: false, // Remove window frame for overlay effect
    alwaysOnTop: true, // Keep window on top
    resizable: true,
    transparent: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Restore window position if saved
  const windowBounds = store.get('windowBounds');
  if (windowBounds) {
    mainWindow.setBounds(windowBounds);
  }

  // Save window position when moved or resized
  mainWindow.on('moved', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  mainWindow.on('resized', () => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  // Create a simple context menu for the window
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Close',
      click: () => {
        app.quit();
      }
    },
    {
      label: 'Reset Position',
      click: () => {
        mainWindow.center();
        store.delete('windowBounds');
      }
    }
  ]);

  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup();
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for timer functionality
ipcMain.handle('save-data', (event, data) => {
  // Get existing stored data to preserve tickets
  const existingData = store.get('timerData') || {};
  
  // Merge the new data with existing data, preserving tickets
  const mergedData = {
    ...existingData,
    ...data,
    tickets: existingData.tickets || [] // Always preserve existing tickets
  };
  
  console.log('Saving data, merged:', mergedData);
  store.set('timerData', mergedData);
});

ipcMain.handle('load-data', () => {
  const data = store.get('timerData') || {};
  const result = {
    tickets: data.tickets || [],
    sessions: data.sessions || [],
    currentTicket: data.currentTicket || null,
    isRunning: data.isRunning || false
  };
  console.log('Loading data, returning:', result);
  return result;
});

ipcMain.handle('get-tickets', () => {
  const data = store.get('timerData') || {};
  console.log('Getting tickets, full data:', data);
  const tickets = data.tickets || [];
  console.log('Returning tickets:', tickets);
  return tickets;
});

ipcMain.handle('add-ticket', (event, ticket) => {
  // Get existing data or create new object
  let data = store.get('timerData') || {};
  console.log('Before adding ticket, current data:', data);
  
  // Ensure tickets array exists
  if (!data.tickets || !Array.isArray(data.tickets)) {
    data.tickets = [];
  }
  
  // Add the new ticket
  data.tickets.push(ticket);
  
  // Save the updated data
  store.set('timerData', data);
  
  // Verify what was saved
  const savedData = store.get('timerData');
  console.log('After saving, stored data:', savedData);
  console.log('Returning tickets array:', savedData.tickets);
  
  return savedData.tickets;
});

ipcMain.handle('save-session', (event, session) => {
  const data = store.get('timerData', { sessions: [] });
  if (!data.sessions) data.sessions = [];
  data.sessions.push(session);
  store.set('timerData', data);
});

// Close window handler
ipcMain.handle('close-window', () => {
  app.quit();
});
