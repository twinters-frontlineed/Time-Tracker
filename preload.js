const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  getTickets: () => ipcRenderer.invoke('get-tickets'),
  addTicket: (ticket) => ipcRenderer.invoke('add-ticket', ticket),
  replaceTickets: (tickets) => ipcRenderer.invoke('replace-tickets', tickets),
  getTicketTime: (ticket) => ipcRenderer.invoke('get-ticket-time', ticket),
  updateTicketTime: (ticket, time) => ipcRenderer.invoke('update-ticket-time', ticket, time),
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Jira integration
  saveJiraSettings: (settings) => ipcRenderer.invoke('save-jira-settings', settings),
  loadJiraSettings: () => ipcRenderer.invoke('load-jira-settings'),
  testJiraConnection: (settings) => ipcRenderer.invoke('test-jira-connection', settings),
  syncJiraTickets: (settings) => ipcRenderer.invoke('sync-jira-tickets', settings)
});
