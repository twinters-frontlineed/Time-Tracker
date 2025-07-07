console.log('Renderer.js loaded');

class TimeTracker {
    constructor() {
        console.log('TimeTracker constructor called');
        this.startTime = null;
        this.ticketTimes = {}; // Store elapsed time per ticket
        this.isRunning = false;
        this.timerInterval = null;
        this.currentTicket = null;
        
        this.initializeElements();
        this.loadData();
        this.loadJiraSettings();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        console.log('Initializing elements...');
        this.ticketSelect = document.getElementById('ticketSelect');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.notification = document.getElementById('notification');
        
        // Jira elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.syncBtn = document.getElementById('syncBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettings = document.getElementById('closeSettings');
        this.saveSettings = document.getElementById('saveSettings');
        this.testConnection = document.getElementById('testConnection');
        this.alwaysOnTopCheckbox = document.getElementById('alwaysOnTop');
        
        console.log('notification element:', this.notification);
    }
    
    async loadData() {
        console.log('Loading data...');
        console.log('electronAPI available:', !!window.electronAPI);
        try {
            const data = await window.electronAPI.loadData();
            console.log('Loaded data:', data);
            this.populateTicketSelect(data.tickets || []);
            this.ticketTimes = data.ticketTimes || {};
            this.startTime = data.startTime;
            this.isRunning = data.isRunning || false;
            
            // Restore current ticket selection if exists
            if (data.currentTicket) {
                this.ticketSelect.value = data.currentTicket;
                this.currentTicket = data.currentTicket;
            }
            
            // If timer was running, restart it
            if (this.isRunning && this.currentTicket && this.startTime) {
                this.resumeTimer();
            }
            
            this.updateDisplay();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    async loadJiraSettings() {
        try {
            this.jiraSettings = await window.electronAPI.loadJiraSettings();
            const alwaysOnTop = await window.electronAPI.getAlwaysOnTop();
            
            console.log('Loaded Jira settings (without token):', { 
                url: this.jiraSettings.url, 
                email: this.jiraSettings.email,
                projects: this.jiraSettings.projects 
            });
            console.log('Always on top:', alwaysOnTop);
        } catch (error) {
            console.error('Error loading Jira settings:', error);
            this.jiraSettings = {};
        }
    }
    
    async saveData() {
        try {
            const data = {
                currentTicket: this.currentTicket,
                isRunning: this.isRunning,
                startTime: this.startTime,
                ticketTimes: this.ticketTimes
            };
            await window.electronAPI.saveData(data);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    populateTicketSelect(tickets) {
        console.log('Populating ticket select with:', tickets);
        console.log('Current dropdown options before clear:', Array.from(this.ticketSelect.options).map(opt => opt.value));
        
        // Clear existing ticket options (keep the first "Select a ticket..." option)
        while (this.ticketSelect.children.length > 1) {
            this.ticketSelect.removeChild(this.ticketSelect.lastChild);
        }
        
        console.log('Options after clearing:', Array.from(this.ticketSelect.options).map(opt => opt.value));
        
        // Ensure tickets is an array
        const ticketsArray = Array.isArray(tickets) ? tickets : [];
        
        // Add ticket options
        ticketsArray.forEach(ticket => {
            console.log('Adding ticket option:', ticket);
            const option = document.createElement('option');
            option.value = ticket;
            option.textContent = ticket;
            this.ticketSelect.appendChild(option);
        });
        
        console.log('Final select options:', Array.from(this.ticketSelect.options).map(opt => opt.value));
        console.log('Final select options count:', this.ticketSelect.children.length);
    }
    
    bindEvents() {
        // Close button event listener
        document.getElementById('closeBtn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });
        
        this.ticketSelect.addEventListener('change', async () => {
            // Save current ticket time before switching
            if (this.isRunning && this.currentTicket) {
                await this.updateCurrentTicketTime();
            }
            
            this.currentTicket = this.ticketSelect.value;
            this.updateDisplay();
            this.saveData();
        });
        
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Jira integration event listeners
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.syncBtn.addEventListener('click', () => this.syncJiraTickets());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettings.addEventListener('click', () => this.saveJiraSettings());
        this.testConnection.addEventListener('click', () => this.testJiraConnection());
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }
    
    
    startTimer() {
        if (!this.currentTicket) {
            this.showNotification('Please select a ticket first', 'error');
            return;
        }
        
        if (this.isRunning) return;
        
        // Initialize ticket time if it doesn't exist
        if (!this.ticketTimes[this.currentTicket]) {
            this.ticketTimes[this.currentTicket] = 0;
        }
        
        this.startTime = Date.now();
        this.isRunning = true;
        
        this.timerInterval = setInterval(async () => {
            await this.updateCurrentTicketTime();
            this.updateDisplay();
        }, 1000);
        
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.saveData();
    }
    
    async updateCurrentTicketTime() {
        if (this.isRunning && this.currentTicket && this.startTime) {
            const currentTime = Date.now();
            const sessionTime = currentTime - this.startTime;
            this.ticketTimes[this.currentTicket] = (this.ticketTimes[this.currentTicket] || 0) + sessionTime;
            this.startTime = currentTime; // Reset start time for next interval
            
            // Update backend
            await window.electronAPI.updateTicketTime(this.currentTicket, this.ticketTimes[this.currentTicket]);
        }
    }
    
    resumeTimer() {
        if (!this.currentTicket || this.isRunning) return;
        
        this.startTime = Date.now();
        this.isRunning = true;
        
        this.timerInterval = setInterval(async () => {
            await this.updateCurrentTicketTime();
            this.updateDisplay();
        }, 1000);
        
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
    }
    
    async stopTimer() {
        if (!this.isRunning) return;
        
        // Update the current ticket time one final time
        await this.updateCurrentTicketTime();
        
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        // Save the time session
        const session = {
            ticket: this.currentTicket,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: this.ticketTimes[this.currentTicket] || 0,
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        };
        
        try {
            await window.electronAPI.saveSession(session);
        } catch (error) {
            console.error('Error saving session:', error);
        }
        
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.saveData();
    }
    
    async resetTimer() {
        if (this.isRunning) {
            await this.stopTimer();
        }
        
        if (this.currentTicket) {
            this.ticketTimes[this.currentTicket] = 0;
            await window.electronAPI.updateTicketTime(this.currentTicket, 0);
        }
        
        this.startTime = null;
        this.updateDisplay();
        this.saveData();
    }
    
    updateDisplay() {
        let displayTime = 0;
        
        if (this.currentTicket) {
            displayTime = this.ticketTimes[this.currentTicket] || 0;
            
            // If timer is running, add the current session time
            if (this.isRunning && this.startTime) {
                displayTime += Date.now() - this.startTime;
            }
        }
        
        const totalSeconds = Math.floor(displayTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerDisplay.textContent = display;
    }
    
    showNotification(message, type = 'warning', duration = 3000) {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        // Hide the notification after the specified duration
        this.notificationTimeout = setTimeout(() => {
            this.notification.className = 'notification hidden';
        }, duration);
    }
    
    // Jira Integration Methods
    async openSettings() {
        try {
            const settings = await window.electronAPI.loadJiraSettings();
            const alwaysOnTop = await window.electronAPI.getAlwaysOnTop();
            
            // Pre-fill the form with saved settings
            document.getElementById('jiraUrl').value = settings.url || 'https://frontlinetechnologies.atlassian.net';
            document.getElementById('jiraEmail').value = settings.email || '';
            document.getElementById('jiraToken').value = settings.token || '';
            document.getElementById('jiraProjects').value = settings.projects || 'HCMRH,HR';
            this.alwaysOnTopCheckbox.checked = alwaysOnTop;
            
            this.settingsModal.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading Jira settings:', error);
            this.settingsModal.classList.remove('hidden');
        }
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.add('hidden');
    }
    
    async saveJiraSettings() {
        const settings = {
            url: document.getElementById('jiraUrl').value.trim(),
            email: document.getElementById('jiraEmail').value.trim(),
            token: document.getElementById('jiraToken').value.trim(),
            projects: document.getElementById('jiraProjects').value.trim()
        };
        
        const alwaysOnTop = this.alwaysOnTopCheckbox.checked;
        
        if (!settings.url || !settings.email || !settings.token) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        try {
            await window.electronAPI.saveJiraSettings(settings);
            await window.electronAPI.setAlwaysOnTop(alwaysOnTop);
            this.showNotification('Settings saved successfully!', 'success');
            this.closeSettingsModal();
        } catch (error) {
            console.error('Error saving Jira settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }
    
    async testJiraConnection() {
        const settings = {
            url: document.getElementById('jiraUrl').value.trim(),
            email: document.getElementById('jiraEmail').value.trim(),
            token: document.getElementById('jiraToken').value.trim(),
            projects: document.getElementById('jiraProjects').value.trim()
        };
        
        if (!settings.url || !settings.email || !settings.token) {
            this.showNotification('Please fill in all fields to test connection', 'error');
            return;
        }
        
        this.testConnection.textContent = 'Testing...';
        this.testConnection.disabled = true;
        
        try {
            const result = await window.electronAPI.testJiraConnection(settings);
            
            if (result.success) {
                this.showNotification(`Connection successful! Hello, ${result.user}`, 'success');
            } else {
                this.showNotification(`Connection failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error testing Jira connection:', error);
            this.showNotification('Error testing connection', 'error');
        } finally {
            this.testConnection.textContent = 'Test Connection';
            this.testConnection.disabled = false;
        }
    }
    
    async syncJiraTickets() {
        try {
            const settings = await window.electronAPI.loadJiraSettings();
            
            if (!settings.url || !settings.email || !settings.token) {
                this.showNotification('Please configure Jira settings first', 'error');
                return;
            }
            
            this.syncBtn.textContent = '⏳';
            this.syncBtn.classList.add('syncing');
            
            const result = await window.electronAPI.syncJiraTickets(settings);
            
            if (result.success) {
                // Replace all tickets with the synced tickets from Jira
                const ticketKeys = result.tickets.map(ticket => ticket.key);
                const updatedTickets = await window.electronAPI.replaceTickets(ticketKeys);
                
                // Initialize times for new tickets that don't have times yet
                for (const ticketKey of ticketKeys) {
                    if (!this.ticketTimes[ticketKey]) {
                        this.ticketTimes[ticketKey] = 0;
                    }
                }
                
                // Refresh the dropdown
                this.populateTicketSelect(updatedTickets);
                
                // Check if current ticket is still valid
                if (this.currentTicket && !ticketKeys.includes(this.currentTicket)) {
                    this.currentTicket = null;
                    this.ticketSelect.value = '';
                    this.updateDisplay();
                    this.saveData();
                }
                
                // Show success icon briefly
                this.syncBtn.textContent = '✅';
                this.syncBtn.classList.remove('syncing');
                this.syncBtn.classList.add('success');
                setTimeout(() => {
                    this.syncBtn.textContent = '🔄';
                    this.syncBtn.classList.remove('success');
                }, 2000);
                
                console.log('Synced tickets:', result.tickets);
            } else {
                // Show error icon briefly
                this.syncBtn.textContent = '❌';
                this.syncBtn.classList.remove('syncing');
                this.syncBtn.classList.add('error');
                setTimeout(() => {
                    this.syncBtn.textContent = '🔄';
                    this.syncBtn.classList.remove('error');
                }, 3000);
                this.showNotification(`Sync failed: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error syncing Jira tickets:', error);
            this.syncBtn.textContent = '❌';
            this.syncBtn.classList.remove('syncing');
            this.syncBtn.classList.add('error');
            setTimeout(() => {
                this.syncBtn.textContent = '🔄';
                this.syncBtn.classList.remove('error');
            }, 3000);
            this.showNotification('Error syncing tickets', 'error');
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating TimeTracker...');
    new TimeTracker();
});
