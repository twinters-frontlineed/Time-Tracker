const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const axios = require('axios');

const store = new Store();

let mainWindow;

function createWindow() {
  // Get always on top setting (default to true for overlay behavior)
  const alwaysOnTop = store.get('alwaysOnTop', true);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 280,
    height: 160,
    frame: false, // Remove window frame for overlay effect
    alwaysOnTop: alwaysOnTop, // Configurable always on top
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

  // Restore window position if saved, but validate it's on a visible display
  const windowBounds = store.get('windowBounds');
  if (windowBounds) {
    const validBounds = validateWindowBounds(windowBounds);
    mainWindow.setBounds(validBounds);
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
  // Get existing stored data to preserve tickets and ticket times
  const existingData = store.get('timerData') || {};
  
  // Merge the new data with existing data, preserving tickets and ticketTimes
  const mergedData = {
    ...existingData,
    ...data,
    tickets: existingData.tickets || [], // Always preserve existing tickets
    ticketTimes: { ...(existingData.ticketTimes || {}), ...(data.ticketTimes || {}) } // Merge ticket times
  };
  
  console.log('Saving data, merged:', mergedData);
  store.set('timerData', mergedData);
});

ipcMain.handle('load-data', () => {
  const data = store.get('timerData') || {};
  const result = {
    tickets: data.tickets || [],
    ticketTimes: data.ticketTimes || {}, // Object to store time per ticket
    sessions: data.sessions || [],
    currentTicket: data.currentTicket || null,
    isRunning: data.isRunning || false,
    startTime: data.startTime || null
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
  
  // Ensure ticketTimes object exists
  if (!data.ticketTimes || typeof data.ticketTimes !== 'object') {
    data.ticketTimes = {};
  }
  
  // Add the new ticket
  data.tickets.push(ticket);
  
  // Initialize time for the new ticket if it doesn't exist
  if (!data.ticketTimes[ticket]) {
    data.ticketTimes[ticket] = 0;
  }
  
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

// Jira Integration Handlers
ipcMain.handle('save-jira-settings', (event, settings) => {
  store.set('jiraSettings', settings);
  console.log('Saved Jira settings');
});

ipcMain.handle('load-jira-settings', () => {
  return store.get('jiraSettings', {});
});

// Always On Top Setting Handlers
ipcMain.handle('set-always-on-top', (event, alwaysOnTop) => {
  store.set('alwaysOnTop', alwaysOnTop);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(alwaysOnTop);
  }
});

ipcMain.handle('get-always-on-top', () => {
  return store.get('alwaysOnTop', true);
});

ipcMain.handle('test-jira-connection', async (event, settings) => {
  try {
    const auth = Buffer.from(`${settings.email}:${settings.token}`).toString('base64');
    
    const response = await axios.get(`${settings.url}/rest/api/2/myself`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    return { success: true, user: response.data.displayName };
  } catch (error) {
    console.error('Jira connection test failed:', error.message);
    return { 
      success: false, 
      error: error.response?.data?.errorMessages?.[0] || error.message 
    };
  }
});

ipcMain.handle('sync-jira-tickets', async (event, settings) => {
  try {
    const auth = Buffer.from(`${settings.email}:${settings.token}`).toString('base64');
    
    // Build JQL query for assigned tickets in specified projects that are "In Progress"
    const projects = settings.projects.split(',').map(p => p.trim()).filter(p => p);
    const projectFilter = projects.length > 0 ? `project in (${projects.join(',')}) AND ` : '';
    const jql = `${projectFilter}assignee = currentuser() AND status = "In Progress" ORDER BY updated DESC`;
    
    console.log('Executing JQL:', jql);
    
    const response = await axios.get(`${settings.url}/rest/api/2/search`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      },
      params: {
        jql: jql,
        fields: 'key,summary,status',
        maxResults: 50
      },
      timeout: 15000
    });
    
    const tickets = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name
    }));
    
    console.log(`Found ${tickets.length} tickets`);
    return { success: true, tickets };
    
  } catch (error) {
    console.error('Jira sync failed:', error.message);
    return { 
      success: false, 
      error: error.response?.data?.errorMessages?.[0] || error.message 
    };
  }
});

ipcMain.handle('replace-tickets', (event, newTickets) => {
  // Get existing data or create new object
  let data = store.get('timerData') || {};
  console.log('Replacing tickets, current data:', data);
  
  // Preserve ticket times for tickets that still exist
  const existingTicketTimes = data.ticketTimes || {};
  const newTicketTimes = {};
  
  newTickets.forEach(ticket => {
    if (existingTicketTimes[ticket]) {
      newTicketTimes[ticket] = existingTicketTimes[ticket];
    } else {
      newTicketTimes[ticket] = 0; // Initialize new tickets with 0 time
    }
  });
  
  // Replace the tickets array entirely
  data.tickets = newTickets;
  data.ticketTimes = newTicketTimes;
  
  // If the current ticket is not in the new list, clear it
  if (data.currentTicket && !newTickets.includes(data.currentTicket)) {
    data.currentTicket = null;
    data.isRunning = false;
    data.startTime = null;
  }
  
  // Save the updated data
  store.set('timerData', data);
  
  console.log('After replacing, stored data:', data);
  return data.tickets;
});

ipcMain.handle('get-ticket-time', (event, ticket) => {
  const data = store.get('timerData') || {};
  const ticketTimes = data.ticketTimes || {};
  return ticketTimes[ticket] || 0;
});

ipcMain.handle('update-ticket-time', (event, ticket, time) => {
  let data = store.get('timerData') || {};
  if (!data.ticketTimes) data.ticketTimes = {};
  data.ticketTimes[ticket] = time;
  store.set('timerData', data);
  return data.ticketTimes[ticket];
});
