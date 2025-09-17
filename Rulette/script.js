class RuleEtteGame {
    constructor() {
        this.teams = [];
        this.draftOrder = [];
        this.currentSpinIndex = 0;
        this.availablePositions = [];
        this.currentTurnIndex = 0;
        this.availableRules = [];
        this.selectedRules = [];
        this.ruleHistory = [];
        this.timerInterval = null;
        this.timerDuration = 120; // 2 minutes in seconds
        this.timeRemaining = this.timerDuration;
        this.timerPaused = false;
        this.gamePhase = 'setup'; // 'setup', 'spinning', 'yankee-swap', 'final-pick'
        this.teamAssignments = []; // Track team-number assignments
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Setup teams button
        document.getElementById('setup-teams').addEventListener('click', () => this.setupTeams());
        
        // Start yankee swap button
        document.getElementById('start-game-btn').addEventListener('click', () => this.startYankeeSwap());
        
        // Game action buttons
        document.getElementById('submit-new-btn').addEventListener('click', () => this.submitNewRule());
        document.getElementById('keep-current-btn').addEventListener('click', () => this.keepCurrentRule());
        
        // Timer pause button
        document.getElementById('pause-btn').addEventListener('click', () => this.toggleTimer());
        
        // Enter key support for rule input
        document.getElementById('rule-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submitNewRule();
            }
        });
    }

    setupTeams() {
        const teamNamesText = document.getElementById('player-names').value.trim();
        if (!teamNamesText) {
            alert('Please enter team names!');
            return;
        }

        this.teams = teamNamesText.split('\n').filter(name => name.trim()).map(name => name.trim());
        
        if (this.teams.length < 2 || this.teams.length > 9) {
            alert('Please enter 2-9 teams!');
            return;
        }

        // Initialize draft order array
        this.draftOrder = new Array(this.teams.length);
        
        // Show manual draft order interface
        document.querySelector('.player-setup').style.display = 'none';
        document.getElementById('manual-draft-order').style.display = 'block';
        
        this.gamePhase = 'manual-setup';
        this.createPositionAssignments();
        
        console.log('Teams setup complete:', this.teams);
    }

    createPositionAssignments() {
        const container = document.getElementById('position-assignments');
        container.innerHTML = '';
        
        // Create dropdown for each position
        for (let position = 1; position <= this.teams.length; position++) {
            const assignmentDiv = document.createElement('div');
            assignmentDiv.className = 'position-assignment';
            
            const label = document.createElement('label');
            label.textContent = `Position ${position}:`;
            label.className = 'position-label';
            
            const select = document.createElement('select');
            select.id = `position-${position}`;
            select.className = 'team-select';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select team...';
            select.appendChild(defaultOption);
            
            // Add team options
            this.teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team;
                option.textContent = team;
                select.appendChild(option);
            });
            
            // Add change listener
            select.addEventListener('change', () => this.updatePositionAssignment(position, select.value));
            
            assignmentDiv.appendChild(label);
            assignmentDiv.appendChild(select);
            container.appendChild(assignmentDiv);
        }
    }
    
    updatePositionAssignment(position, teamName) {
        if (teamName) {
            // Check if team is already assigned to another position
            const existingPosition = this.draftOrder.indexOf(teamName);
            if (existingPosition !== -1) {
                // Clear the previous assignment
                this.draftOrder[existingPosition] = null;
                document.getElementById(`position-${existingPosition + 1}`).value = '';
            }
            
            // Assign team to new position
            this.draftOrder[position - 1] = teamName;
        } else {
            // Clear assignment
            this.draftOrder[position - 1] = null;
        }
        
        // Check if all positions are assigned
        const allAssigned = this.draftOrder.every(team => team !== null && team !== undefined);
        document.getElementById('start-game-btn').style.display = allAssigned ? 'block' : 'none';
        
        console.log('Draft order updated:', this.draftOrder);
    }

    startYankeeSwap() {
        this.gamePhase = 'yankee-swap';
        this.currentTurnIndex = 0;
        
        // Hide setup section, show game section
        document.querySelector('.setup-section').style.display = 'none';
        document.getElementById('game-section').style.display = 'block';
        document.querySelector('.sidebar').style.display = 'block';
        
        // Update draft order display
        this.updateDraftOrderDisplay();
        
        this.startTurn();
    }

    startTurn() {
        if (this.currentTurnIndex >= this.draftOrder.length) {
            this.finalPickPhase();
            return;
        }

        const currentTeam = this.draftOrder[this.currentTurnIndex];
        document.getElementById('current-player-name').textContent = currentTeam;
        
        // Update instruction based on turn
        if (this.currentTurnIndex === 0) {
            document.getElementById('turn-instruction').textContent = 
                'Submit the first rule - you will get the final pick opportunity!';
        } else {
            document.getElementById('turn-instruction').textContent = 
                'Submit a new rule or swap with an existing rule';
        }
        
        // Reset and start timer
        this.timeRemaining = this.timerDuration;
        this.timerPaused = false;
        this.updateTimerDisplay();
        this.startTimer();
        
        // Clear rule input
        document.getElementById('rule-input').value = '';
        
        // Update available rules display
        this.updateAvailableRulesDisplay();
        this.updateDraftOrderDisplay();
        
        console.log(`Turn started for ${currentTeam} (Draft position ${this.currentTurnIndex + 1})`);
    }

    toggleTimer() {
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.timerPaused) {
            this.timerPaused = false;
            pauseBtn.textContent = 'Pause';
            this.startTimer();
        } else {
            this.timerPaused = true;
            pauseBtn.textContent = 'Resume';
            this.clearTimer();
        }
    }

    startTimer() {
        if (this.timerPaused) return;
        
        this.clearTimer();
        
        this.timerInterval = setInterval(() => {
            if (!this.timerPaused) {
                this.timeRemaining--;
                this.updateTimerDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.timeUp();
                }
            }
        }, 1000);
    }

    clearTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-text').textContent = timeString;
        
        // Update progress bar
        const progressPercent = (this.timeRemaining / this.timerDuration) * 100;
        document.getElementById('timer-progress').style.width = `${progressPercent}%`;
        
        // Change color when time is running low
        const timerProgress = document.getElementById('timer-progress');
        if (this.timeRemaining <= 30) {
            timerProgress.style.backgroundColor = '#ff6b6b';
        } else if (this.timeRemaining <= 60) {
            timerProgress.style.backgroundColor = '#ffa726';
        } else {
            timerProgress.style.backgroundColor = '#66bb6a';
        }
    }

    timeUp() {
        this.clearTimer();
        alert(`Time's up for ${this.draftOrder[this.currentTurnIndex]}!`);
        this.nextTurn();
    }

    submitNewRule() {
        const ruleText = document.getElementById('rule-input').value.trim();
        if (!ruleText) {
            alert('Please enter a rule!');
            return;
        }

        const currentTeam = this.draftOrder[this.currentTurnIndex];
        const newRule = {
            id: Date.now(),
            text: ruleText,
            originalTeam: currentTeam,
            currentOwner: currentTeam
        };
        
        this.availableRules.push(newRule);
        
        // Add to history
        this.ruleHistory.push({
            round: this.currentTurnIndex + 1,
            team: currentTeam,
            action: 'SUBMITTED',
            rule: ruleText
        });
        
        this.updateRuleHistoryDisplay();
        this.nextTurn();
        
        console.log(`${currentTeam} submitted rule: ${ruleText}`);
    }

    swapRule(ruleId) {
        const ruleIndex = this.availableRules.findIndex(rule => rule.id === ruleId);
        if (ruleIndex === -1) return;
        
        const currentTeam = this.draftOrder[this.currentTurnIndex];
        const selectedRule = this.availableRules[ruleIndex];
        
        // Add to history
        this.ruleHistory.push({
            round: this.currentTurnIndex + 1,
            team: currentTeam,
            action: 'SWAPPED',
            rule: selectedRule.text,
            previousOwner: selectedRule.currentOwner
        });
        
        // Update rule ownership
        selectedRule.currentOwner = currentTeam;
        
        this.updateRuleHistoryDisplay();
        this.nextTurn();
        
        console.log(`${currentTeam} swapped for rule: ${selectedRule.text}`);
    }

    nextTurn() {
        this.clearTimer();
        this.currentTurnIndex++;
        
        if (this.currentTurnIndex >= this.draftOrder.length) {
            this.finalPickPhase();
        } else {
            this.startTurn();
        }
    }

    finalPickPhase() {
        this.gamePhase = 'final-pick';
        
        // The first picker (draft position 1) gets the final choice
        const firstPicker = this.draftOrder[0];
        document.getElementById('current-player-name').textContent = firstPicker;
        document.getElementById('turn-instruction').textContent = 
            'Final pick! Choose any rule or keep your current rule.';
        
        // Show keep current button if first picker has a rule
        const firstPickerRule = this.availableRules.find(rule => rule.currentOwner === firstPicker);
        if (firstPickerRule) {
            document.getElementById('keep-current-btn').style.display = 'block';
        }
        
        // Reset timer for final pick
        this.timeRemaining = this.timerDuration;
        this.timerPaused = false;
        this.updateTimerDisplay();
        this.startTimer();
        
        this.updateAvailableRulesDisplay();
        
        console.log(`Final pick phase for ${firstPicker}`);
    }

    keepCurrentRule() {
        const firstPicker = this.draftOrder[0];
        
        // Add to history
        this.ruleHistory.push({
            round: 'Final',
            team: firstPicker,
            action: 'KEPT',
            rule: 'Current rule'
        });
        
        this.updateRuleHistoryDisplay();
        this.endGame();
    }

    endGame() {
        this.clearTimer();
        document.getElementById('current-player-name').textContent = 'Yankee Swap Complete!';
        document.getElementById('timer-text').textContent = '00:00';
        document.querySelector('.action-buttons').style.display = 'none';
        document.querySelector('.rule-input').style.display = 'none';
        document.querySelector('.timer').style.display = 'none';
        document.getElementById('turn-instruction').textContent = 
            'Game complete! Check the rule history for final rule assignments.';
        
        // Show final rule assignments
        this.showFinalRuleAssignments();
        
        alert('Yankee Swap complete! Check the final rule assignments.');
        console.log('Game ended');
    }

    showFinalRuleAssignments() {
        const rulesContainer = document.getElementById('rules-list');
        rulesContainer.innerHTML = '<h4>Final Rule Assignments:</h4>';
        
        this.availableRules.forEach(rule => {
            const ruleElement = document.createElement('div');
            ruleElement.className = 'final-rule-assignment';
            ruleElement.innerHTML = `
                <div class="rule-owner">${rule.currentOwner}</div>
                <div class="rule-text">${rule.text}</div>
                <div class="rule-original">Originally by: ${rule.originalTeam}</div>
            `;
            rulesContainer.appendChild(ruleElement);
        });
    }

    updateAvailableRulesDisplay() {
        const rulesContainer = document.getElementById('rules-list');
        rulesContainer.innerHTML = '';
        
        if (this.availableRules.length === 0) {
            rulesContainer.innerHTML = '<p>No rules available yet. Submit the first rule!</p>';
            return;
        }
        
        this.availableRules.forEach(rule => {
            const ruleElement = document.createElement('div');
            ruleElement.className = 'available-rule';
            ruleElement.innerHTML = `
                <div class="rule-text">${rule.text}</div>
                <div class="rule-info">
                    <span class="rule-owner">Current: ${rule.currentOwner}</span>
                    <span class="rule-original">Original: ${rule.originalTeam}</span>
                </div>
                <button class="swap-button" onclick="game.swapRule(${rule.id})">Swap for This Rule</button>
            `;
            rulesContainer.appendChild(ruleElement);
        });
    }

    updateDraftOrderDisplay() {
        const orderList = document.getElementById('draft-order-list');
        orderList.innerHTML = '';
        
        this.draftOrder.forEach((team, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = team;
            
            if (index === this.currentTurnIndex && this.gamePhase === 'yankee-swap') {
                listItem.classList.add('current-player');
            }
            if (index < this.currentTurnIndex || this.gamePhase === 'final-pick') {
                listItem.classList.add('completed');
            }
            
            orderList.appendChild(listItem);
        });
    }

    updateRuleHistoryDisplay() {
        const historyContainer = document.getElementById('rule-history-list');
        historyContainer.innerHTML = '';
        
        this.ruleHistory.forEach((entry, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            let actionClass = 'submit';
            if (entry.action === 'SWAPPED') actionClass = 'swap';
            else if (entry.action === 'KEPT') actionClass = 'keep';
            
            let actionText = entry.action;
            if (entry.action === 'SWAPPED' && entry.previousOwner) {
                actionText += ` (from ${entry.previousOwner})`;
            }
            
            historyItem.innerHTML = `
                <div class="history-header">
                    <span class="round">Round ${entry.round}</span>
                    <span class="player">${entry.team}</span>
                    <span class="action ${actionClass}">${actionText}</span>
                </div>
                <div class="history-rule">${entry.rule}</div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
    }


    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Global game instance for onclick handlers
let game;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new RuleEtteGame();
});