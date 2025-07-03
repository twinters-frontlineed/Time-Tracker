console.log('Renderer.js loaded');

class TimeTracker {
    constructor() {
        console.log('TimeTracker constructor called');
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.timerInterval = null;
        this.currentTicket = null;
        
        this.initializeElements();
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        console.log('Initializing elements...');
        this.ticketInput = document.getElementById('ticketInput');
        this.addTicketBtn = document.getElementById('addTicketBtn');
        this.ticketSelect = document.getElementById('ticketSelect');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.notification = document.getElementById('notification');
        
        console.log('addTicketBtn element:', this.addTicketBtn);
        console.log('ticketInput element:', this.ticketInput);
        console.log('notification element:', this.notification);
    }
    
    async loadData() {
        console.log('Loading data...');
        console.log('electronAPI available:', !!window.electronAPI);
        try {
            const data = await window.electronAPI.loadData();
            console.log('Loaded data:', data);
            this.populateTicketSelect(data.tickets || []);
            
            // Restore current ticket selection if exists
            if (data.currentTicket) {
                this.ticketSelect.value = data.currentTicket;
                this.currentTicket = data.currentTicket;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    async saveData() {
        try {
            const data = {
                currentTicket: this.currentTicket,
                isRunning: this.isRunning,
                elapsedTime: this.elapsedTime
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
        
        this.addTicketBtn.addEventListener('click', () => {
            console.log('Add ticket button clicked');
            this.addTicket();
        });
        this.ticketInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTicket();
            }
        });
        
        this.ticketSelect.addEventListener('change', () => {
            this.currentTicket = this.ticketSelect.value;
            this.saveData();
        });
        
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.stopBtn.addEventListener('click', () => this.stopTimer());
        this.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    async addTicket() {
        console.log('addTicket called');
        const ticketValue = this.ticketInput.value.trim().toUpperCase();
        console.log('Ticket value:', ticketValue);
        
        if (!ticketValue) {
            this.showNotification('Please enter a ticket number', 'error');
            return;
        }
        
        // Basic Jira ticket format validation
        const jiraPattern = /^[A-Z]+-\d+$/;
        if (!jiraPattern.test(ticketValue)) {
            this.showNotification('Please use format: ABC-123', 'error');
            return;
        }
        
        try {
            console.log('Checking existing tickets...');
            // Check if ticket already exists
            const existingTickets = await window.electronAPI.getTickets();
            console.log('Existing tickets:', existingTickets);
            
            // Ensure existingTickets is an array
            const ticketsArray = Array.isArray(existingTickets) ? existingTickets : [];
            
            if (ticketsArray.includes(ticketValue)) {
                console.log('Ticket already exists');
                this.showNotification('Ticket already exists - selected it for you', 'warning');
                this.ticketSelect.value = ticketValue;
                this.currentTicket = ticketValue;
                this.ticketInput.value = '';
                return;
            }
            
            console.log('Adding new ticket...');
            // Add new ticket
            const updatedTickets = await window.electronAPI.addTicket(ticketValue);
            console.log('Updated tickets:', updatedTickets);
            
            this.populateTicketSelect(updatedTickets);
            
            // Select the newly added ticket
            this.ticketSelect.value = ticketValue;
            this.currentTicket = ticketValue;
            this.ticketInput.value = '';
            
            console.log('Ticket added successfully');
            this.showNotification(`${ticketValue} added successfully!`, 'success', 2000);
            this.saveData();
            
        } catch (error) {
            console.error('Error adding ticket:', error);
            this.showNotification('Error adding ticket', 'error');
        }
    }
    
    startTimer() {
        if (!this.currentTicket) {
            this.showNotification('Please select a ticket first', 'error');
            return;
        }
        
        if (this.isRunning) return;
        
        this.startTime = Date.now() - this.elapsedTime;
        this.isRunning = true;
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
        }, 1000);
        
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.saveData();
    }
    
    async stopTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        // Save the time session
        const session = {
            ticket: this.currentTicket,
            startTime: this.startTime,
            endTime: Date.now(),
            duration: this.elapsedTime,
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
    
    resetTimer() {
        if (this.isRunning) {
            this.stopTimer();
        }
        
        this.elapsedTime = 0;
        this.startTime = null;
        this.updateDisplay();
        this.saveData();
    }
    
    updateDisplay() {
        const totalSeconds = Math.floor(this.elapsedTime / 1000);
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
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating TimeTracker...');
    new TimeTracker();
});
