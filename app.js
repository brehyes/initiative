// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Application state
    const state = {
        combatants: [],
        activeCombatantIndex: -1,
        isInCombat: false,
        round: 0,
        savedEncounters: []
    };

    // DOM Elements
    const elements = {
        // Initiative list
        initiativeList: document.getElementById('initiative-list'),
        roundNumber: document.getElementById('round-number'),
        
        // Combatant form
        addCombatantForm: document.getElementById('add-combatant-form'),
        combatantName: document.getElementById('combatant-name'),
        initiativeRoll: document.getElementById('initiative-roll'),
        rollInitiativeBtn: document.getElementById('roll-initiative'),
        combatantHp: document.getElementById('combatant-hp'),
        combatantType: document.getElementById('combatant-type'),
        combatantAc: document.getElementById('combatant-ac'),
        combatantInitBonus: document.getElementById('combatant-init-bonus'),
        combatantNotes: document.getElementById('combatant-notes'),
        
        // Combat controls
        startCombatBtn: document.getElementById('start-combat'),
        nextTurnBtn: document.getElementById('next-turn'),
        nextRoundBtn: document.getElementById('next-round'),
        endCombatBtn: document.getElementById('end-combat'),
        
        // Active combatant details
        activeCombatantContainer: document.getElementById('active-combatant-details'),
        activeName: document.getElementById('active-name'),
        activeHp: document.getElementById('active-hp'),
        activeMaxHp: document.getElementById('active-max-hp'),
        activeAc: document.getElementById('active-ac'),
        activeNotes: document.getElementById('active-notes'),
        activeConditions: document.getElementById('active-conditions'),
        
        // HP controls
        damageBtn: document.getElementById('damage-btn'),
        healBtn: document.getElementById('heal-btn'),
        hpModal: document.getElementById('hp-modal'),
        hpModalTitle: document.getElementById('hp-modal-title'),
        hpAmount: document.getElementById('hp-amount'),
        confirmHpChangeBtn: document.getElementById('confirm-hp-change'),
        closeModal: document.querySelector('.close-modal'),
        
        // Condition controls
        conditionSelect: document.getElementById('condition-select'),
        addConditionBtn: document.getElementById('add-condition-btn'),
        
        // Encounter management
        newEncounterBtn: document.getElementById('new-encounter'),
        saveEncounterBtn: document.getElementById('save-encounter'),
        loadEncounterBtn: document.getElementById('load-encounter')
    };

    // Initialize the application
    function init() {
        // Load any saved encounters from localStorage
        loadSavedEncounters();
        
        // Add event listeners
        attachEventListeners();
        
        // Check if there's a saved state in localStorage
        const savedState = localStorage.getItem('initiativeState');
        if (savedState) {
            // Restore the saved state
            const parsedState = JSON.parse(savedState);
            Object.assign(state, parsedState);
            
            // Update the UI
            refreshInitiativeList();
            updateCombatControls();
            updateRoundInfo();
            
            if (state.isInCombat && state.activeCombatantIndex >= 0) {
                updateActiveCombatantDetails();
            }
        }
    }

    // Attach event listeners to DOM elements
    function attachEventListeners() {
        // Form submission
        elements.addCombatantForm.addEventListener('submit', handleAddCombatant);
        
        // Initiative roll button
        elements.rollInitiativeBtn.addEventListener('click', rollInitiative);
        
        // Combat controls
        elements.startCombatBtn.addEventListener('click', startCombat);
        elements.nextTurnBtn.addEventListener('click', nextTurn);
        elements.nextRoundBtn.addEventListener('click', nextRound);
        elements.endCombatBtn.addEventListener('click', endCombat);
        
        // HP modification
        elements.damageBtn.addEventListener('click', () => openHpModal('damage'));
        elements.healBtn.addEventListener('click', () => openHpModal('heal'));
        elements.confirmHpChangeBtn.addEventListener('click', confirmHpChange);
        elements.closeModal.addEventListener('click', closeHpModal);
        
        // Conditions
        elements.addConditionBtn.addEventListener('click', addCondition);
        
        // Encounter management
        elements.newEncounterBtn.addEventListener('click', confirmNewEncounter);
        elements.saveEncounterBtn.addEventListener('click', saveEncounter);
        elements.loadEncounterBtn.addEventListener('click', showLoadEncounterModal);
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.hpModal) {
                closeHpModal();
            }
        });
    }

    // Handle adding a new combatant
    function handleAddCombatant(e) {
        e.preventDefault();
        
        const newCombatant = {
            name: elements.combatantName.value,
            initiative: parseInt(elements.initiativeRoll.value),
            initiativeBonus: parseInt(elements.combatantInitBonus.value),
            hp: parseInt(elements.combatantHp.value),
            maxHp: parseInt(elements.combatantHp.value),
            ac: parseInt(elements.combatantAc.value),
            type: elements.combatantType.value,
            notes: elements.combatantNotes.value,
            conditions: []
        };
        
        // Add to state and refresh UI
        state.combatants.push(newCombatant);
        sortCombatants();
        refreshInitiativeList();
        updateCombatControls();
        saveState();
        
        // Reset form
        elements.addCombatantForm.reset();
        elements.combatantName.focus();
    }

    // Roll initiative for a new combatant
    function rollInitiative() {
        const initBonus = parseInt(elements.combatantInitBonus.value) || 0;
        const dieRoll = Math.floor(Math.random() * 20) + 1;
        const total = dieRoll + initBonus;
        
        elements.initiativeRoll.value = total;
    }

    // Sort combatants by initiative
    function sortCombatants() {
        state.combatants.sort((a, b) => {
            // Sort by initiative (higher first)
            if (b.initiative !== a.initiative) {
                return b.initiative - a.initiative;
            }
            // If equal, sort by initiative bonus
            if (b.initiativeBonus !== a.initiativeBonus) {
                return b.initiativeBonus - a.initiativeBonus;
            }
            // If still equal, sort alphabetically
            return a.name.localeCompare(b.name);
        });
    }

    // Refresh the initiative list in the UI
    function refreshInitiativeList() {
        // Clear the list
        elements.initiativeList.innerHTML = '';
        
        if (state.combatants.length === 0) {
            // Show empty state
            elements.initiativeList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-dice-d20"></i>
                    <p>Add combatants to begin tracking initiative</p>
                </div>
            `;
            return;
        }
        
        // Populate with combatants
        state.combatants.forEach((combatant, index) => {
            const isActive = index === state.activeCombatantIndex && state.isInCombat;
            
            const combatantElement = document.createElement('div');
            combatantElement.className = `combatant ${combatant.type} ${isActive ? 'active' : ''}`;
            combatantElement.innerHTML = `
                <div class="combatant-initiative">${combatant.initiative}</div>
                <div class="combatant-info">
                    <div class="combatant-name">${combatant.name}</div>
                    <div class="combatant-status">
                        <div class="combatant-hp">HP: ${combatant.hp}/${combatant.maxHp}</div>
                        <div class="combatant-ac">AC: ${combatant.ac}</div>
                        ${combatant.conditions.length > 0 ? 
                            `<div class="combatant-conditions">
                                <i class="fas fa-exclamation-triangle" title="${combatant.conditions.join(', ')}"></i>
                            </div>` : ''}
                    </div>
                </div>
                <div class="combatant-actions">
                    <button class="btn-icon edit-combatant" title="Edit combatant">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon remove-combatant" title="Remove from combat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners to the buttons
            combatantElement.querySelector('.edit-combatant').addEventListener('click', () => editCombatant(index));
            combatantElement.querySelector('.remove-combatant').addEventListener('click', () => removeCombatant(index));
            
            elements.initiativeList.appendChild(combatantElement);
        });
    }

    // Update the combat control buttons based on state
    function updateCombatControls() {
        const hasCombatants = state.combatants.length > 0;
        
        elements.startCombatBtn.disabled = !hasCombatants || state.isInCombat;
        elements.nextTurnBtn.disabled = !state.isInCombat;
        elements.nextRoundBtn.disabled = !state.isInCombat;
        elements.endCombatBtn.disabled = !state.isInCombat;
        
        elements.activeCombatantContainer.classList.toggle('hidden', !state.isInCombat || state.activeCombatantIndex < 0);
    }

    // Update the round information
    function updateRoundInfo() {
        elements.roundNumber.textContent = state.round;
    }

    // Update the active combatant details panel
    function updateActiveCombatantDetails() {
        if (state.activeCombatantIndex < 0 || !state.isInCombat) {
            elements.activeCombatantContainer.classList.add('hidden');
            return;
        }
        
        const activeCombatant = state.combatants[state.activeCombatantIndex];
        
        elements.activeName.textContent = activeCombatant.name;
        elements.activeHp.textContent = activeCombatant.hp;
        elements.activeMaxHp.textContent = activeCombatant.maxHp;
        elements.activeAc.textContent = activeCombatant.ac;
        elements.activeNotes.textContent = activeCombatant.notes || 'None';
        
        // Update conditions
        elements.activeConditions.innerHTML = '';
        activeCombatant.conditions.forEach(condition => {
            const conditionTag = document.createElement('div');
            conditionTag.className = 'condition-tag';
            conditionTag.innerHTML = `
                ${condition}
                <button class="remove-condition" data-condition="${condition}">×</button>
            `;
            
            // Add event listener to remove condition
            conditionTag.querySelector('.remove-condition').addEventListener('click', function() {
                removeCondition(this.dataset.condition);
            });
            
            elements.activeConditions.appendChild(conditionTag);
        });
        
        elements.activeCombatantContainer.classList.remove('hidden');
    }

    // Start combat
    function startCombat() {
        if (state.combatants.length === 0) return;
        
        state.isInCombat = true;
        state.round = 1;
        state.activeCombatantIndex = 0;
        
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatControls();
        updateActiveCombatantDetails();
        saveState();
    }

    // Move to the next turn
    function nextTurn() {
        if (!state.isInCombat) return;
        
        // Move to next combatant
        state.activeCombatantIndex++;
        
        // If we've gone through all combatants, move to next round
        if (state.activeCombatantIndex >= state.combatants.length) {
            nextRound();
            return;
        }
        
        refreshInitiativeList();
        updateActiveCombatantDetails();
        saveState();
    }

    // Move to the next round
    function nextRound() {
        if (!state.isInCombat) return;
        
        state.round++;
        state.activeCombatantIndex = 0;
        
        updateRoundInfo();
        refreshInitiativeList();
        updateActiveCombatantDetails();
        saveState();
    }

    // End combat
    function endCombat() {
        state.isInCombat = false;
        state.round = 0;
        state.activeCombatantIndex = -1;
        
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatControls();
        elements.activeCombatantContainer.classList.add('hidden');
        saveState();
    }

    // Open HP modification modal
    function openHpModal(type) {
        if (state.activeCombatantIndex < 0) return;
        
        elements.hpModalTitle.textContent = type === 'damage' ? 'Apply Damage' : 'Apply Healing';
        elements.hpAmount.value = 1;
        elements.hpModal.dataset.type = type;
        elements.hpModal.classList.remove('hidden');
    }

    // Close HP modal
    function closeHpModal() {
        elements.hpModal.classList.add('hidden');
    }

    // Confirm HP change
    function confirmHpChange() {
        if (state.activeCombatantIndex < 0) return;
        
        const amount = parseInt(elements.hpAmount.value) || 0;
        const type = elements.hpModal.dataset.type;
        const activeCombatant = state.combatants[state.activeCombatantIndex];
        
        if (type === 'damage') {
            activeCombatant.hp = Math.max(0, activeCombatant.hp - amount);
        } else {
            activeCombatant.hp = Math.min(activeCombatant.maxHp, activeCombatant.hp + amount);
        }
        
        closeHpModal();
        updateActiveCombatantDetails();
        refreshInitiativeList();
        saveState();
    }

    // Add a condition to the active combatant
    function addCondition() {
        if (state.activeCombatantIndex < 0) return;
        
        const condition = elements.conditionSelect.value;
        if (!condition) return;
        
        const activeCombatant = state.combatants[state.activeCombatantIndex];
        
        // Don't add duplicates
        if (!activeCombatant.conditions.includes(condition)) {
            activeCombatant.conditions.push(condition);
            updateActiveCombatantDetails();
            refreshInitiativeList();
            saveState();
        }
        
        // Reset select
        elements.conditionSelect.value = '';
    }

    // Remove a condition from the active combatant
    function removeCondition(condition) {
        if (state.activeCombatantIndex < 0) return;
        
        const activeCombatant = state.combatants[state.activeCombatantIndex];
        activeCombatant.conditions = activeCombatant.conditions.filter(c => c !== condition);
        
        updateActiveCombatantDetails();
        refreshInitiativeList();
        saveState();
    }

    // Edit a combatant
    function editCombatant(index) {
        const combatant = state.combatants[index];
        
        // Populate form with combatant data
        elements.combatantName.value = combatant.name;
        elements.initiativeRoll.value = combatant.initiative;
        elements.combatantHp.value = combatant.maxHp;
        elements.combatantType.value = combatant.type;
        elements.combatantAc.value = combatant.ac;
        elements.combatantInitBonus.value = combatant.initiativeBonus;
        elements.combatantNotes.value = combatant.notes;
        
        // Remove the combatant
        removeCombatant(index);
        
        // Focus on the form
        elements.combatantName.focus();
    }

    // Remove a combatant
    function removeCombatant(index) {
        // If removing the active combatant, move to the next one
        if (state.isInCombat && index === state.activeCombatantIndex) {
            if (state.combatants.length > 1) {
                // If this is the last combatant in the list, go to the first one
                if (index === state.combatants.length - 1) {
                    state.activeCombatantIndex = 0;
                }
                // Otherwise, the index stays the same as the next combatant will take this position
            } else {
                // If this is the only combatant, end combat
                endCombat();
            }
        } else if (state.isInCombat && index < state.activeCombatantIndex) {
            // If removing a combatant before the active one, adjust the index
            state.activeCombatantIndex--;
        }
        
        // Remove the combatant
        state.combatants.splice(index, 1);
        
        // Update UI
        refreshInitiativeList();
        updateCombatControls();
        if (state.isInCombat) {
            updateActiveCombatantDetails();
        }
        saveState();
    }

    // Confirm new encounter
    function confirmNewEncounter() {
        if (state.combatants.length === 0) {
            newEncounter();
            return;
        }
        
        if (confirm('Start a new encounter? This will clear all current combatants.')) {
            newEncounter();
        }
    }

    // Start a new encounter
    function newEncounter() {
        state.combatants = [];
        state.activeCombatantIndex = -1;
        state.isInCombat = false;
        state.round = 0;
        
        refreshInitiativeList();
        updateCombatControls();
        updateRoundInfo();
        elements.activeCombatantContainer.classList.add('hidden');
        saveState();
    }

    // Save the current encounter
    function saveEncounter() {
        if (state.combatants.length === 0) {
            alert('No combatants to save!');
            return;
        }
        
        const encounterName = prompt('Enter a name for this encounter:');
        if (!encounterName) return;
        
        const encounter = {
            name: encounterName,
            date: new Date().toISOString(),
            combatants: state.combatants
        };
        
        // Add to saved encounters
        state.savedEncounters.push(encounter);
        
        // Save to localStorage
        localStorage.setItem('initiativeSavedEncounters', JSON.stringify(state.savedEncounters));
        
        alert(`Encounter "${encounterName}" saved!`);
    }

    // Show load encounter modal
    function showLoadEncounterModal() {
        if (state.savedEncounters.length === 0) {
            alert('No saved encounters found!');
            return;
        }
        
        // Create a list of saved encounters to choose from
        const encounterList = state.savedEncounters.map((encounter, index) => {
            const date = new Date(encounter.date).toLocaleDateString();
            return `${index + 1}. ${encounter.name} (${date}) - ${encounter.combatants.length} combatants`;
        }).join('\n');
        
        const selectedIndex = prompt(`Select an encounter to load (enter number):\n\n${encounterList}`);
        
        if (!selectedIndex) return;
        
        const index = parseInt(selectedIndex) - 1;
        if (isNaN(index) || index < 0 || index >= state.savedEncounters.length) {
            alert('Invalid selection!');
            return;
        }
        
        loadEncounter(index);
    }

    // Load a saved encounter
    function loadEncounter(index) {
        if (state.combatants.length > 0) {
            if (!confirm('Loading an encounter will replace your current combatants. Continue?')) {
                return;
            }
        }
        
        const encounter = state.savedEncounters[index];
        state.combatants = JSON.parse(JSON.stringify(encounter.combatants)); // Deep copy
        state.activeCombatantIndex = -1;
        state.isInCombat = false;
        state.round = 0;
        
        refreshInitiativeList();
        updateCombatControls();
        updateRoundInfo();
        elements.activeCombatantContainer.classList.add('hidden');
        saveState();
        
        alert(`Encounter "${encounter.name}" loaded!`);
    }

    // Load saved encounters from localStorage
    function loadSavedEncounters() {
        const savedEncounters = localStorage.getItem('initiativeSavedEncounters');
        if (savedEncounters) {
            state.savedEncounters = JSON.parse(savedEncounters);
        }
    }

    // Save current state to localStorage
    function saveState() {
        localStorage.setItem('initiativeState', JSON.stringify({
            combatants: state.combatants,
            activeCombatantIndex: state.activeCombatantIndex,
            isInCombat: state.isInCombat,
            round: state.round
        }));
    }

    // Initialize the application
    init();
});
