// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Application state
    const state = {
        combatants: [],
        activeCombatantIndex: -1,
        isInCombat: false,
        round: 0,
        savedEncounters: [],
        turnHistory: [], // Store history of turns for backward navigation
        currentHistoryIndex: -1 // Current position in the turn history
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
        
        // Spellcaster options
        isSpellcaster: document.getElementById('is-spellcaster'),
        spellcasterOptions: document.getElementById('spellcaster-options'),
        spellSlotInputs: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => 
            document.getElementById(`spell-slot-${level}`)
        ),
        
        // Limited-use feature options
        hasLimitedUse: document.getElementById('has-limited-use'),
        limitedUseOptions: document.getElementById('limited-use-options'),
        limitedUseName: document.getElementById('limited-use-name'),
        limitedUseCharges: document.getElementById('limited-use-charges'),
        addLimitedUseBtn: document.getElementById('add-limited-use'),
        limitedUseList: document.getElementById('limited-use-list'),
        
        // Legendary options
        hasLegendary: document.getElementById('has-legendary'),
        legendaryOptions: document.getElementById('legendary-options'),
        legendaryActions: document.getElementById('legendary-actions'),
        legendaryResistances: document.getElementById('legendary-resistances'),
        
        // Combat controls
        startCombatBtn: document.getElementById('start-combat'),
        prevTurnBtn: document.getElementById('prev-turn'),
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
        
        // Action economy
        actionUsed: document.getElementById('action-used'),
        bonusActionUsed: document.getElementById('bonus-action-used'),
        reactionUsed: document.getElementById('reaction-used'),
        
        // Active combatant special resources
        activeSpellcasterSection: document.getElementById('active-spellcaster-section'),
        activeSpellSlots: document.querySelector('.active-spell-slots'),
        
        activeLimitedUseSection: document.getElementById('active-limited-use-section'),
        activeLimitedUseList: document.getElementById('active-limited-use-list'),
        
        activeLegendarySection: document.getElementById('active-legendary-section'),
        legendaryActionsCount: document.getElementById('legendary-actions-count'),
        legendaryResistancesCount: document.getElementById('legendary-resistances-count'),
        
        // HP controls
        damageBtn: document.getElementById('damage-btn'),
        healBtn: document.getElementById('heal-btn'),
        hpModal: document.getElementById('hp-modal'),
        hpModalTitle: document.getElementById('hp-modal-title'),
        hpAmount: document.getElementById('hp-amount'),
        confirmHpChangeBtn: document.getElementById('confirm-hp-change'),
        closeModal: document.querySelector('.close-modal'),
        
        // Condition controls
        activeConditions: document.getElementById('active-conditions'),
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
        
        // Toggle options visibility
        elements.isSpellcaster.addEventListener('change', toggleSpellcasterOptions);
        elements.hasLimitedUse.addEventListener('change', toggleLimitedUseOptions);
        elements.hasLegendary.addEventListener('change', toggleLegendaryOptions);
        
        // Add limited-use feature
        elements.addLimitedUseBtn.addEventListener('click', addLimitedUseFeature);
        
        // Combat controls
        elements.startCombatBtn.addEventListener('click', startCombat);
        elements.prevTurnBtn.addEventListener('click', previousTurn);
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
        
        // Action economy
        elements.actionUsed.addEventListener('change', updateActionEconomy);
        elements.bonusActionUsed.addEventListener('change', updateActionEconomy);
        elements.reactionUsed.addEventListener('change', updateActionEconomy);
        
        // Legendary resource counters
        document.querySelectorAll('.counter-dec, .counter-inc').forEach(btn => {
            btn.addEventListener('click', handleLegendaryCounter);
        });
        
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

    // Toggle spellcaster options visibility
    function toggleSpellcasterOptions() {
        elements.spellcasterOptions.classList.toggle('hidden', !elements.isSpellcaster.checked);
    }
    
    // Toggle limited-use options visibility
    function toggleLimitedUseOptions() {
        elements.limitedUseOptions.classList.toggle('hidden', !elements.hasLimitedUse.checked);
    }
    
    // Toggle legendary options visibility
    function toggleLegendaryOptions() {
        elements.legendaryOptions.classList.toggle('hidden', !elements.hasLegendary.checked);
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
            conditions: [],
            actionUsed: false,
            bonusActionUsed: false,
            reactionUsed: false
        };
        
        // Add spellcaster details if checked
        if (elements.isSpellcaster.checked) {
            newCombatant.isSpellcaster = true;
            newCombatant.spellSlots = {
                1: parseInt(elements.spellSlotInputs[0].value) || 0,
                2: parseInt(elements.spellSlotInputs[1].value) || 0,
                3: parseInt(elements.spellSlotInputs[2].value) || 0,
                4: parseInt(elements.spellSlotInputs[3].value) || 0,
                5: parseInt(elements.spellSlotInputs[4].value) || 0,
                6: parseInt(elements.spellSlotInputs[5].value) || 0,
                7: parseInt(elements.spellSlotInputs[6].value) || 0,
                8: parseInt(elements.spellSlotInputs[7].value) || 0,
                9: parseInt(elements.spellSlotInputs[8].value) || 0
            };
            newCombatant.spellSlotsRemaining = {...newCombatant.spellSlots};
        }
        
        // Add limited-use features if checked
        if (elements.hasLimitedUse.checked) {
            newCombatant.limitedUseFeatures = [];
            // Features are added via the addLimitedUseFeature function
            // We'll retrieve them from the DOM
            document.querySelectorAll('#limited-use-list .feature-item').forEach(item => {
                const featureName = item.querySelector('.feature-name').textContent;
                const maxUses = parseInt(item.dataset.maxUses);
                
                newCombatant.limitedUseFeatures.push({
                    name: featureName,
                    maxUses: maxUses,
                    usesRemaining: maxUses
                });
            });
        }
        
        // Add legendary details if checked
        if (elements.hasLegendary.checked) {
            newCombatant.legendary = {
                actions: {
                    max: parseInt(elements.legendaryActions.value) || 3,
                    remaining: parseInt(elements.legendaryActions.value) || 3
                },
                resistances: {
                    max: parseInt(elements.legendaryResistances.value) || 3,
                    remaining: parseInt(elements.legendaryResistances.value) || 3
                }
            };
        }
        
        // Add to state and refresh UI
        state.combatants.push(newCombatant);
        sortCombatants();
        refreshInitiativeList();
        updateCombatControls();
        saveState();
        
        // Reset form and hide extended sections
        elements.addCombatantForm.reset();
        elements.spellcasterOptions.classList.add('hidden');
        elements.limitedUseOptions.classList.add('hidden');
        elements.legendaryOptions.classList.add('hidden');
        elements.limitedUseList.innerHTML = '';
        elements.combatantName.focus();
    }
    
    // Add limited-use feature to form
    function addLimitedUseFeature() {
        const featureName = elements.limitedUseName.value.trim();
        const charges = parseInt(elements.limitedUseCharges.value) || 1;
        
        if (!featureName) {
            alert('Please enter a name for the feature');
            return;
        }
        
        const featureItem = document.createElement('div');
        featureItem.className = 'feature-item';
        featureItem.dataset.maxUses = charges;
        featureItem.innerHTML = `
            <span class="feature-name">${featureName}</span>
            <span class="feature-charges">${charges} uses</span>
            <button type="button" class="btn-small remove-feature"><i class="fas fa-times"></i></button>
        `;
        
        // Add remove button functionality
        featureItem.querySelector('.remove-feature').addEventListener('click', function() {
            featureItem.remove();
        });
        
        elements.limitedUseList.appendChild(featureItem);
        
        // Reset inputs
        elements.limitedUseName.value = '';
        elements.limitedUseCharges.value = 1;
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
            
            // Build status icons for special conditions
            let statusIcons = '';
            
            // Action economy indicators
            if (state.isInCombat) {
                if (combatant.actionUsed) statusIcons += '<i class="fas fa-running" title="Action used" style="color: #718096;"></i> ';
                if (combatant.bonusActionUsed) statusIcons += '<i class="fas fa-bolt" title="Bonus action used" style="color: #718096;"></i> ';
                if (combatant.reactionUsed) statusIcons += '<i class="fas fa-shield-alt" title="Reaction used" style="color: #718096;"></i> ';
            }
            
            // Concentration indicator
            const isConcentrating = combatant.conditions.includes('concentration');
            if (isConcentrating) {
                statusIcons += '<span class="concentrating-indicator" title="Concentrating">C</span>';
            }
            
            // Regular conditions
            const otherConditions = combatant.conditions.filter(c => c !== 'concentration');
            if (otherConditions.length > 0) {
                statusIcons += `<i class="fas fa-exclamation-triangle" title="${otherConditions.join(', ')}"></i>`;
            }
            
            // Build the HTML for the combatant
            combatantElement.innerHTML = `
                <div class="combatant-initiative">${combatant.initiative}</div>
                <div class="combatant-info">
                    <div class="combatant-name">
                        ${combatant.name}
                        ${statusIcons}
                    </div>
                    <div class="combatant-status">
                        <div class="combatant-hp">HP: ${combatant.hp}/${combatant.maxHp}</div>
                        <div class="combatant-ac">AC: ${combatant.ac}</div>
                    </div>
                </div>
                <div class="combatant-actions">
                    <button class="btn-icon view-combatant" title="View/Edit details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-combatant" title="Edit combatant">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon remove-combatant" title="Remove from combat">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners to the buttons
            combatantElement.querySelector('.view-combatant').addEventListener('click', () => viewCombatant(index));
            combatantElement.querySelector('.edit-combatant').addEventListener('click', () => editCombatant(index));
            combatantElement.querySelector('.remove-combatant').addEventListener('click', () => removeCombatant(index));
            
            // Make the whole combatant row clickable to view details
            combatantElement.addEventListener('click', (e) => {
                // Only trigger if they didn't click a button
                if (!e.target.closest('button')) {
                    viewCombatant(index);
                }
            });
            
            elements.initiativeList.appendChild(combatantElement);
        });
    }

    // Update the combat control buttons based on state
    function updateCombatControls() {
        const hasCombatants = state.combatants.length > 0;
        
        elements.startCombatBtn.disabled = !hasCombatants || state.isInCombat;
        elements.prevTurnBtn.disabled = !state.isInCombat || state.turnHistory.length <= 1 || state.currentHistoryIndex <= 0;
        elements.nextTurnBtn.disabled = !state.isInCombat;
        elements.nextRoundBtn.disabled = !state.isInCombat;
        elements.endCombatBtn.disabled = !state.isInCombat;
    }
    
    // View a specific combatant's details
    function viewCombatant(index) {
        if (index < 0 || index >= state.combatants.length) return;
        
        // Store previous active index
        const previousIndex = state.selectedCombatantIndex;
        
        // Set the currently viewed combatant
        state.selectedCombatantIndex = index;
        
        // Update UI to show combatant details
        updateCombatantDetails(index);
        
        // Make details panel visible
        elements.activeCombatantContainer.classList.remove('hidden');
    }

    // Update the round information
    function updateRoundInfo() {
        elements.roundNumber.textContent = state.round;
    }

    // Update a combatant's details panel (active or selected)
    function updateCombatantDetails(index) {
        if (index < 0 || index >= state.combatants.length) {
            elements.activeCombatantContainer.classList.add('hidden');
            return;
        }
        
        const combatant = state.combatants[index];
        
        // Basic details
        elements.activeName.textContent = combatant.name;
        elements.activeHp.textContent = combatant.hp;
        elements.activeMaxHp.textContent = combatant.maxHp;
        elements.activeAc.textContent = combatant.ac;
        elements.activeNotes.textContent = combatant.notes || 'None';
        
        // Action economy checkboxes
        elements.actionUsed.checked = combatant.actionUsed || false;
        elements.bonusActionUsed.checked = combatant.bonusActionUsed || false;
        elements.reactionUsed.checked = combatant.reactionUsed || false;
        
        // Update conditions
        elements.activeConditions.innerHTML = '';
        combatant.conditions.forEach(condition => {
            const conditionTag = document.createElement('div');
            conditionTag.className = `condition-tag ${condition.toLowerCase()}`;
            conditionTag.innerHTML = `
                ${condition}
                <button class="remove-condition" data-condition="${condition}">×</button>
            `;
            
            // Add event listener to remove condition
            conditionTag.querySelector('.remove-condition').addEventListener('click', function() {
                removeCondition(this.dataset.condition, index);
            });
            
            elements.activeConditions.appendChild(conditionTag);
        });
        
        // Spellcaster resources
        if (combatant.isSpellcaster) {
            elements.activeSpellcasterSection.classList.remove('hidden');
            elements.activeSpellSlots.innerHTML = '';
            
            for (let level = 1; level <= 9; level++) {
                const maxSlots = combatant.spellSlots[level];
                if (maxSlots > 0) {
                    const slotsRemaining = combatant.spellSlotsRemaining[level];
                    const slotRow = document.createElement('div');
                    slotRow.className = 'spell-slot-level';
                    slotRow.innerHTML = `
                        <label>${getOrdinal(level)} Level</label>
                        <div class="slot-usage">
                            <span class="slots-remaining">${slotsRemaining}</span>/<span class="slots-total">${maxSlots}</span>
                            <button class="btn-small counter-dec" data-spell-level="${level}"><i class="fas fa-minus"></i></button>
                            <button class="btn-small counter-inc" data-spell-level="${level}"><i class="fas fa-plus"></i></button>
                        </div>
                    `;
                    
                    // Add event listeners for spell slot adjustment
                    slotRow.querySelector('.counter-dec').addEventListener('click', () => adjustSpellSlot(index, level, -1));
                    slotRow.querySelector('.counter-inc').addEventListener('click', () => adjustSpellSlot(index, level, 1));
                    
                    elements.activeSpellSlots.appendChild(slotRow);
                }
            }
        } else {
            elements.activeSpellcasterSection.classList.add('hidden');
        }
        
        // Limited-use features
        if (combatant.limitedUseFeatures && combatant.limitedUseFeatures.length > 0) {
            elements.activeLimitedUseSection.classList.remove('hidden');
            elements.activeLimitedUseList.innerHTML = '';
            
            combatant.limitedUseFeatures.forEach((feature, featureIndex) => {
                const featureItem = document.createElement('div');
                featureItem.className = 'feature-item';
                featureItem.innerHTML = `
                    <span class="feature-name">${feature.name}</span>
                    <div class="feature-controls">
                        <button class="btn-small counter-dec" data-feature-index="${featureIndex}"><i class="fas fa-minus"></i></button>
                        <span class="feature-count">${feature.usesRemaining}</span>/<span>${feature.maxUses}</span>
                        <button class="btn-small counter-inc" data-feature-index="${featureIndex}"><i class="fas fa-plus"></i></button>
                    </div>
                `;
                
                // Add event listeners for feature usage
                featureItem.querySelector('.counter-dec').addEventListener('click', () => adjustFeatureUses(index, featureIndex, -1));
                featureItem.querySelector('.counter-inc').addEventListener('click', () => adjustFeatureUses(index, featureIndex, 1));
                
                elements.activeLimitedUseList.appendChild(featureItem);
            });
        } else {
            elements.activeLimitedUseSection.classList.add('hidden');
        }
        
        // Legendary resources
        if (combatant.legendary) {
            elements.activeLegendarySection.classList.remove('hidden');
            elements.legendaryActionsCount.textContent = combatant.legendary.actions.remaining;
            elements.legendaryResistancesCount.textContent = combatant.legendary.resistances.remaining;
            
            // Re-attach event listeners for legendary resources
            const legendaryButtons = elements.activeLegendarySection.querySelectorAll('.counter-dec, .counter-inc');
            legendaryButtons.forEach(btn => {
                btn.removeEventListener('click', handleLegendaryCounter);
                btn.addEventListener('click', (e) => handleLegendaryCounter(e, index));
            });
        } else {
            elements.activeLegendarySection.classList.add('hidden');
        }
        
        // Store the index for later reference in events
        elements.activeCombatantContainer.dataset.combatantIndex = index;
        
        // Show the details panel
        elements.activeCombatantContainer.classList.remove('hidden');
    }
    
    // Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
    function getOrdinal(n) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
    }
    
    // Adjust spell slot count
    function adjustSpellSlot(combatantIndex, level, change) {
        const combatant = state.combatants[combatantIndex];
        if (!combatant || !combatant.isSpellcaster) return;
        
        const newValue = Math.min(
            Math.max(0, combatant.spellSlotsRemaining[level] + change),
            combatant.spellSlots[level]
        );
        
        combatant.spellSlotsRemaining[level] = newValue;
        updateCombatantDetails(combatantIndex);
        refreshInitiativeList();
        saveState();
    }
    
    // Adjust limited use feature charges
    function adjustFeatureUses(combatantIndex, featureIndex, change) {
        const combatant = state.combatants[combatantIndex];
        if (!combatant || !combatant.limitedUseFeatures) return;
        
        const feature = combatant.limitedUseFeatures[featureIndex];
        if (!feature) return;
        
        const newValue = Math.min(
            Math.max(0, feature.usesRemaining + change),
            feature.maxUses
        );
        
        feature.usesRemaining = newValue;
        updateCombatantDetails(combatantIndex);
        refreshInitiativeList();
        saveState();
    }
    
    // Handle legendary resource counter adjustments
    function handleLegendaryCounter(e, combatantIndex) {
        const target = e.currentTarget;
        const type = target.dataset.counter;
        const change = target.classList.contains('counter-dec') ? -1 : 1;
        
        // Use the combatant index from the event if provided, otherwise from the dataset
        const index = combatantIndex !== undefined ? 
            combatantIndex : 
            parseInt(elements.activeCombatantContainer.dataset.combatantIndex);
            
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        const combatant = state.combatants[index];
        if (!combatant || !combatant.legendary) return;
        
        if (type === 'legendary-actions') {
            combatant.legendary.actions.remaining = Math.min(
                Math.max(0, combatant.legendary.actions.remaining + change),
                combatant.legendary.actions.max
            );
        } else if (type === 'legendary-resistances') {
            combatant.legendary.resistances.remaining = Math.min(
                Math.max(0, combatant.legendary.resistances.remaining + change),
                combatant.legendary.resistances.max
            );
        }
        
        updateCombatantDetails(index);
        refreshInitiativeList();
        saveState();
    }
    
    // Update action economy based on checkbox changes
    function updateActionEconomy() {
        const index = parseInt(elements.activeCombatantContainer.dataset.combatantIndex);
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        const combatant = state.combatants[index];
        
        combatant.actionUsed = elements.actionUsed.checked;
        combatant.bonusActionUsed = elements.bonusActionUsed.checked;
        combatant.reactionUsed = elements.reactionUsed.checked;
        
        refreshInitiativeList();
        saveState();
    }

    // Start combat
    function startCombat() {
        if (state.combatants.length === 0) return;
        
        state.isInCombat = true;
        state.round = 1;
        state.activeCombatantIndex = 0;
        state.selectedCombatantIndex = 0;
        state.turnHistory = [{ round: 1, index: 0 }];
        state.currentHistoryIndex = 0;
        
        // Reset action economy and legendary resources for all combatants
        state.combatants.forEach(combatant => {
            combatant.actionUsed = false;
            combatant.bonusActionUsed = false;
            combatant.reactionUsed = false;
            
            // Reset legendary actions at the start of combat
            if (combatant.legendary) {
                combatant.legendary.actions.remaining = combatant.legendary.actions.max;
            }
        });
        
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatControls();
        updateCombatantDetails(state.activeCombatantIndex);
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
        
        // Record this turn in history
        if (state.currentHistoryIndex < state.turnHistory.length - 1) {
            // If we're in the middle of history, truncate future history
            state.turnHistory = state.turnHistory.slice(0, state.currentHistoryIndex + 1);
        }
        
        state.turnHistory.push({
            round: state.round,
            index: state.activeCombatantIndex
        });
        state.currentHistoryIndex = state.turnHistory.length - 1;
        
        // Reset action economy for new turn
        const activeCombatant = state.combatants[state.activeCombatantIndex];
        activeCombatant.actionUsed = false;
        activeCombatant.bonusActionUsed = false;
        
        // Reset legendary actions at the start of a creature's turn
        if (activeCombatant.legendary) {
            activeCombatant.legendary.actions.remaining = activeCombatant.legendary.actions.max;
        }
        
        state.selectedCombatantIndex = state.activeCombatantIndex;
        refreshInitiativeList();
        updateCombatantDetails(state.activeCombatantIndex);
        updateCombatControls();
        saveState();
    }

    // Move to the previous turn
    function previousTurn() {
        if (!state.isInCombat || state.currentHistoryIndex <= 0) return;
        
        state.currentHistoryIndex--;
        const prevTurn = state.turnHistory[state.currentHistoryIndex];
        
        state.round = prevTurn.round;
        state.activeCombatantIndex = prevTurn.index;
        state.selectedCombatantIndex = prevTurn.index;
        
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatantDetails(state.activeCombatantIndex);
        updateCombatControls();
        saveState();
    }

    // Move to the next round
    function nextRound() {
        if (!state.isInCombat) return;
        
        state.round++;
        state.activeCombatantIndex = 0;
        
        // Reset all reactions at the start of a new round
        state.combatants.forEach(combatant => {
            combatant.reactionUsed = false;
        });
        
        // Record this round in history
        if (state.currentHistoryIndex < state.turnHistory.length - 1) {
            // If we're in the middle of history, truncate future history
            state.turnHistory = state.turnHistory.slice(0, state.currentHistoryIndex + 1);
        }
        
        state.turnHistory.push({
            round: state.round,
            index: 0
        });
        state.currentHistoryIndex = state.turnHistory.length - 1;
        
        state.selectedCombatantIndex = 0;
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatantDetails(state.activeCombatantIndex);
        updateCombatControls();
        saveState();
    }

    // End combat
    function endCombat() {
        state.isInCombat = false;
        state.round = 0;
        state.activeCombatantIndex = -1;
        state.selectedCombatantIndex = -1;
        state.turnHistory = [];
        state.currentHistoryIndex = -1;
        
        // Reset all action economy, conditions, and resources
        state.combatants.forEach(combatant => {
            combatant.actionUsed = false;
            combatant.bonusActionUsed = false;
            combatant.reactionUsed = false;
            
            // Reset spell slots to max
            if (combatant.isSpellcaster) {
                combatant.spellSlotsRemaining = {...combatant.spellSlots};
            }
            
            // Reset limited-use features
            if (combatant.limitedUseFeatures) {
                combatant.limitedUseFeatures.forEach(feature => {
                    feature.usesRemaining = feature.maxUses;
                });
            }
            
            // Reset legendary resources
            if (combatant.legendary) {
                combatant.legendary.actions.remaining = combatant.legendary.actions.max;
                combatant.legendary.resistances.remaining = combatant.legendary.resistances.max;
            }
        });
        
        updateRoundInfo();
        refreshInitiativeList();
        updateCombatControls();
        elements.activeCombatantContainer.classList.add('hidden');
        saveState();
    }

    // Open HP modification modal
    function openHpModal(type) {
        const index = parseInt(elements.activeCombatantContainer.dataset.combatantIndex);
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        elements.hpModalTitle.textContent = type === 'damage' ? 'Apply Damage' : 'Apply Healing';
        elements.hpAmount.value = 1;
        elements.hpModal.dataset.type = type;
        elements.hpModal.dataset.combatantIndex = index;
        elements.hpModal.classList.remove('hidden');
    }

    // Close HP modal
    function closeHpModal() {
        elements.hpModal.classList.add('hidden');
    }

    // Confirm HP change
    function confirmHpChange() {
        const index = parseInt(elements.hpModal.dataset.combatantIndex);
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        const amount = parseInt(elements.hpAmount.value) || 0;
        const type = elements.hpModal.dataset.type;
        const combatant = state.combatants[index];
        
        if (type === 'damage') {
            combatant.hp = Math.max(0, combatant.hp - amount);
            
            // Check for concentration
            if (combatant.conditions.includes('concentration')) {
                const dcCheck = Math.max(10, Math.floor(amount / 2));
                const message = `${combatant.name} must make a concentration check (DC ${dcCheck})`;
                alert(message);
            }
        } else {
            combatant.hp = Math.min(combatant.maxHp, combatant.hp + amount);
        }
        
        closeHpModal();
        updateCombatantDetails(index);
        refreshInitiativeList();
        saveState();
    }

    // Add a condition to a combatant
    function addCondition() {
        const index = parseInt(elements.activeCombatantContainer.dataset.combatantIndex);
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        const condition = elements.conditionSelect.value;
        if (!condition) return;
        
        const combatant = state.combatants[index];
        
        // Don't add duplicates
        if (!combatant.conditions.includes(condition)) {
            combatant.conditions.push(condition);
            updateCombatantDetails(index);
            refreshInitiativeList();
            saveState();
        }
        
        // Reset select
        elements.conditionSelect.value = '';
    }

    // Remove a condition from a combatant
    function removeCondition(condition, index) {
        // If index not provided, get from dataset
        if (index === undefined) {
            index = parseInt(elements.activeCombatantContainer.dataset.combatantIndex);
        }
        
        if (isNaN(index) || index < 0 || index >= state.combatants.length) return;
        
        const combatant = state.combatants[index];
        combatant.conditions = combatant.conditions.filter(c => c !== condition);
        
        updateCombatantDetails(index);
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
            selectedCombatantIndex: state.selectedCombatantIndex,
            isInCombat: state.isInCombat,
            round: state.round,
            turnHistory: state.turnHistory,
            currentHistoryIndex: state.currentHistoryIndex
        }));
    }

    // Initialize the application
    init();
});
