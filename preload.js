const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: () => ipcRenderer.invoke('load-data'),
  getTickets: () => ipcRenderer.invoke('get-tickets'),
  addTicket: (ticket) => ipcRenderer.invoke('add-ticket', ticket),
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  closeWindow: () => ipcRenderer.invoke('close-window')
});
