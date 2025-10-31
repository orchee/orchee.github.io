// Card Game Logic
class CardGame {
    constructor() {
        this.suits = {
            spades: { name: 'Spades', symbol: '♠', class: 'spades' },
            hearts: { name: 'Hearts', symbol: '♥', class: 'hearts' },
            diamonds: { name: 'Diamonds', symbol: '♦', class: 'diamonds' },
            clubs: { name: 'Clubs', symbol: '♣', class: 'clubs' }
        };
        
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        // Rank values for sorting (Ace highest to 2 lowest)
        this.rankValues = {
            'A': 14,
            'K': 13,
            'Q': 12,
            'J': 11,
            '10': 10,
            '9': 9,
            '8': 8,
            '7': 7,
            '6': 6,
            '5': 5,
            '4': 4,
            '3': 3,
            '2': 2
        };
        
        this.deck = [];
        this.drawnCards = [];
        this.hiddenSuit = null;
        this.correctAnswer = 0;
        this.score = 0;
        this.timer = null;
        this.baseTime = 7.0;
        this.timeRemaining = 7.0;
        this.timerInterval = null;
        this.consecutiveCorrect = 0;
        this.currentRoundType = 'single'; // 'single' or 'double'
        this.handN = [];
        this.handS = [];
        
        this.initializeDeck();
    }
    
    initializeDeck() {
        this.deck = [];
        for (const suitKey in this.suits) {
            for (const rank of this.ranks) {
                this.deck.push({
                    rank: rank,
                    suit: suitKey,
                    suitData: this.suits[suitKey]
                });
            }
        }
    }
    
    shuffleDeck() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    drawCards(count = 13) {
        this.initializeDeck();
        this.shuffleDeck();
        this.drawnCards = this.deck.slice(0, count);
        return this.drawnCards;
    }
    
    drawTwoHands() {
        this.initializeDeck();
        this.shuffleDeck();
        this.handN = this.deck.slice(0, 13);
        this.handS = this.deck.slice(13, 26);
        return { handN: this.handN, handS: this.handS };
    }
    
    getHandCounts(hand) {
        const counts = {
            spades: 0,
            hearts: 0,
            diamonds: 0,
            clubs: 0
        };
        
        hand.forEach(card => {
            counts[card.suit]++;
        });
        
        return counts;
    }
    
    selectRoundType() {
        // 10% chance for sum round, 20% for double round, 70% for single round
        const rand = Math.random();
        if (rand < 0.1) {
            this.currentRoundType = 'sum';
        } else if (rand < 0.3) {
            this.currentRoundType = 'double';
        } else {
            this.currentRoundType = 'single';
        }
        return this.currentRoundType;
    }
    
    calculateRemainingCards() {
        const countsN = this.getHandCounts(this.handN);
        const countsS = this.getHandCounts(this.handS);
        
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        this.hiddenSuit = suits[Math.floor(Math.random() * suits.length)];
        
        // Total cards in suit: 13
        // Remaining in deck (WE) = 13 - N - S
        this.correctAnswer = 13 - countsN[this.hiddenSuit] - countsS[this.hiddenSuit];
        
        return {
            countsN,
            countsS,
            hiddenSuit: this.hiddenSuit,
            answer: this.correctAnswer
        };
    }
    
    groupAndSortCards() {
        const grouped = {
            spades: [],
            hearts: [],
            diamonds: [],
            clubs: []
        };
        
        // Group cards by suit
        this.drawnCards.forEach(card => {
            grouped[card.suit].push(card);
        });
        
        // Sort each suit from Ace (highest) to 2 (lowest)
        for (const suit in grouped) {
            grouped[suit].sort((a, b) => {
                return this.rankValues[b.rank] - this.rankValues[a.rank];
            });
        }
        
        return grouped;
    }
    
    getCardCounts() {
        const counts = {
            spades: 0,
            hearts: 0,
            diamonds: 0,
            clubs: 0
        };
        
        this.drawnCards.forEach(card => {
            counts[card.suit]++;
        });
        
        return counts;
    }
    
    selectRandomHiddenSuit() {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        this.hiddenSuit = suits[Math.floor(Math.random() * suits.length)];
        const counts = this.getCardCounts();
        this.correctAnswer = counts[this.hiddenSuit];
        return this.hiddenSuit;
    }
    
    generateAnswerOptions() {
        const options = [];
        const correct = this.correctAnswer;
        
        // Generate 3 options that are close to each other
        // Sometimes include duplicate values (can be correct or incorrect)
        const includeDuplicate = Math.random() > 0.5;
        
        if (includeDuplicate) {
            // Decide which value to duplicate
            const possibleOffsets = [-1, 0, 1]; // -1, correct, or +1
            const duplicateOffset = possibleOffsets[Math.floor(Math.random() * possibleOffsets.length)];
            const duplicateValue = Math.max(0, Math.min(13, correct + duplicateOffset));
            
            // Add duplicate value twice
            options.push(duplicateValue);
            options.push(duplicateValue);
            
            // Add one different value
            let otherOffset;
            if (duplicateOffset === 0) {
                // If we duplicated the correct answer, add a wrong one
                otherOffset = Math.random() > 0.5 ? 1 : -1;
            } else {
                // If we duplicated a wrong answer, we might add the correct one
                otherOffset = duplicateOffset === 1 ? -1 : 1;
            }
            const otherValue = Math.max(0, Math.min(13, correct + otherOffset));
            options.push(otherValue);
        } else {
            // No duplicates - include correct answer and two close incorrect answers
            options.push(correct);
            
            // Add two close incorrect answers
            const possibleOffsets = [-2, -1, 1, 2];
            const shuffledOffsets = possibleOffsets.sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < 2; i++) {
                const wrongAnswer = Math.max(0, Math.min(13, correct + shuffledOffsets[i]));
                options.push(wrongAnswer);
            }
        }
        
        // Shuffle the options
        return options.sort(() => Math.random() - 0.5);
    }
    
    generateSumAnswerOptions() {
        const options = [];
        const correct = this.correctAnswer;
        
        // Always include the correct answer first
        const correctFirstPart = Math.floor(Math.random() * (correct + 1));
        const correctSecondPart = correct - correctFirstPart;
        options.push({
            display: `${correctFirstPart} + ${correctSecondPart}`,
            value: correct
        });
        
        // Generate two close incorrect values
        const incorrectValues = [];
        
        // Try to add close values
        const possibleOffsets = [-2, -1, 1, 2];
        const shuffledOffsets = possibleOffsets.sort(() => Math.random() - 0.5);
        
        for (let offset of shuffledOffsets) {
            const value = correct + offset;
            // Only add if it's valid (0-13) and we need more options
            if (value >= 0 && value <= 13 && incorrectValues.length < 2) {
                incorrectValues.push(value);
            }
        }
        
        // If we still don't have 2 incorrect values, add any valid values
        if (incorrectValues.length < 2) {
            for (let i = 0; i <= 13; i++) {
                if (i !== correct && incorrectValues.length < 2 && !incorrectValues.includes(i)) {
                    incorrectValues.push(i);
                }
            }
        }
        
        // Convert incorrect values to sum format
        incorrectValues.forEach(value => {
            const firstPart = Math.floor(Math.random() * (value + 1));
            const secondPart = value - firstPart;
            options.push({
                display: `${firstPart} + ${secondPart}`,
                value: value
            });
        });
        
        // Shuffle the options
        return options.sort(() => Math.random() - 0.5);
    }
    
    startTimer(callback) {
        this.timeRemaining = this.baseTime;
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 0.1;
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                callback('timeout');
            }
        }, 100);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    adjustTimerForCorrect() {
        this.consecutiveCorrect++;
        if (this.consecutiveCorrect >= 2) {
            this.baseTime = Math.max(2.0, this.baseTime - 0.1);
            this.consecutiveCorrect = 0;
        }
    }
    
    adjustTimerForIncorrect() {
        this.baseTime = Math.min(15.0, this.baseTime + 0.1);
        this.consecutiveCorrect = 0;
    }
    
    resetGame() {
        this.stopTimer();
        this.timeRemaining = this.baseTime;
    }
}

// UI Controller
class UIController {
    constructor(game) {
        this.game = game;
        this.cardsContainer = document.getElementById('cardsContainer');
        this.drawButton = document.getElementById('drawCards');
        this.showCardsToggle = document.getElementById('showCardsToggle');
        this.cardsSection = document.getElementById('cardsSection');
        this.trumpSection = document.getElementById('trumpSection');
        this.doubleHandSection = document.getElementById('doubleHandSection');
        this.sumRoundSection = document.getElementById('sumRoundSection');
        this.gameStatus = document.getElementById('gameStatus');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.gameHeader = document.getElementById('gameHeader');
        this.answerButtons = [
            document.getElementById('answer1'),
            document.getElementById('answer2'),
            document.getElementById('answer3')
        ];
        this.answerButtonsDouble = [
            document.getElementById('answer1-double'),
            document.getElementById('answer2-double'),
            document.getElementById('answer3-double')
        ];
        this.answerButtonsSum = [
            document.getElementById('answer1-sum'),
            document.getElementById('answer2-sum'),
            document.getElementById('answer3-sum')
        ];
        this.resultSection = document.getElementById('resultSection');
        this.resultMessage = document.getElementById('resultMessage');
        this.nextRoundButton = document.getElementById('nextRound');
        this.hiddenSuitName = document.getElementById('hiddenSuitName');
        this.hiddenSuitNameDouble = document.getElementById('hiddenSuitNameDouble');
        this.hiddenSuitNameSum = document.getElementById('hiddenSuitNameSum');
        
        this.gameActive = false;
        this.currentAnswerOptions = [];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.drawButton.addEventListener('click', () => {
            this.startNewGame();
        });
        
        this.showCardsToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.cardsContainer.style.display = 'block';
            } else {
                this.cardsContainer.style.display = 'none';
            }
        });
        
        this.answerButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.handleAnswer(parseInt(btn.dataset.value));
                }
            });
        });
        
        this.answerButtonsDouble.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.handleAnswer(parseInt(btn.dataset.value));
                }
            });
        });
        
        this.answerButtonsSum.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.handleAnswer(parseInt(btn.dataset.value));
                }
            });
        });
        
        this.nextRoundButton.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Handle number keys for answers
            const key = e.key;
            
            if (this.gameActive && this.currentAnswerOptions.length > 0) {
                const numPressed = parseInt(key);
                
                // Check if the pressed number is one of the available options
                if (!isNaN(numPressed) && this.currentAnswerOptions.includes(numPressed)) {
                    this.handleAnswer(numPressed);
                }
            }
            
            // Handle spacebar for next round
            if (key === ' ' && this.resultSection.style.display !== 'none') {
                e.preventDefault(); // Prevent page scroll
                this.startNewGame();
            }
        });
    }
    
    startNewGame() {
        // Reset game state
        this.game.resetGame();
        this.gameActive = true;
        
        // Hide result section
        this.resultSection.style.display = 'none';
        
        // Hide header when game starts
        this.gameHeader.style.display = 'none';
        
        // Don't reset toggle - keep user's preference
        // Just update cards visibility based on current toggle state
        if (this.showCardsToggle.checked) {
            this.cardsContainer.style.display = 'block';
        } else {
            this.cardsContainer.style.display = 'none';
        }
        
        // Show game status
        this.gameStatus.style.display = 'block';
        
        // Select round type (10% sum, 20% double, 70% single)
        const roundType = this.game.selectRoundType();
        
        if (roundType === 'sum') {
            this.startSumRound();
        } else if (roundType === 'double') {
            this.startDoubleHandRound();
        } else {
            this.startSingleHandRound();
        }
        
        // Update score display
        this.scoreDisplay.textContent = `Score: ${this.game.score}`;
        
        // Start timer
        this.game.startTimer((result) => {
            if (result === 'timeout') {
                this.handleTimeout();
            }
        });
        
        this.updateTimerDisplay();
    }
    
    startSingleHandRound() {
        // Hide other sections, show single
        this.doubleHandSection.style.display = 'none';
        this.sumRoundSection.style.display = 'none';
        this.trumpSection.style.display = 'block';
        this.cardsSection.style.display = 'block';
        
        // Draw cards
        this.game.drawCards(13);
        
        // Display cards
        this.displayCards();
        
        // Select random suit to hide
        const hiddenSuit = this.game.selectRandomHiddenSuit();
        
        // Update counts and hide one
        this.updateCounts(hiddenSuit);
        
        // Update hidden suit name
        const suitData = this.game.suits[hiddenSuit];
        this.hiddenSuitName.innerHTML = `${suitData.symbol} ${suitData.name}`;
        
        // Generate and display answer options
        const options = this.game.generateAnswerOptions();
        this.displayAnswerOptions(options);
    }
    
    startDoubleHandRound() {
        // Hide other sections, show double
        this.trumpSection.style.display = 'none';
        this.cardsSection.style.display = 'none';
        this.sumRoundSection.style.display = 'none';
        this.doubleHandSection.style.display = 'block';
        
        // Draw two hands
        this.game.drawTwoHands();
        
        // Calculate remaining cards and get hidden suit
        const result = this.game.calculateRemainingCards();
        
        // Update N and S counts
        this.updateDoubleHandCounts(result.countsN, result.countsS);
        
        // Update hidden suit name
        const suitData = this.game.suits[result.hiddenSuit];
        this.hiddenSuitNameDouble.innerHTML = `${suitData.symbol} ${suitData.name}`;
        
        // Generate and display answer options for double hand
        const options = this.game.generateAnswerOptions();
        this.displayAnswerOptionsDouble(options);
    }
    
    startSumRound() {
        // Hide other sections, show sum
        this.trumpSection.style.display = 'none';
        this.cardsSection.style.display = 'none';
        this.doubleHandSection.style.display = 'none';
        this.sumRoundSection.style.display = 'block';
        
        // Draw two hands
        this.game.drawTwoHands();
        
        // Calculate remaining cards and get hidden suit
        const result = this.game.calculateRemainingCards();
        
        // Update N and S counts for sum round
        this.updateSumHandCounts(result.countsN, result.countsS);
        
        // Update hidden suit name
        const suitData = this.game.suits[result.hiddenSuit];
        this.hiddenSuitNameSum.innerHTML = `${suitData.symbol} ${suitData.name}`;
        
        // Generate and display sum answer options
        const options = this.game.generateSumAnswerOptions();
        this.displayAnswerOptionsSum(options);
    }
    
    updateTimerDisplay() {
        if (!this.gameActive) return;
        
        const time = Math.max(0, this.game.timeRemaining).toFixed(1);
        this.timerDisplay.textContent = `${time}s`;
        
        if (this.game.timeRemaining <= 1.5) {
            this.timerDisplay.classList.add('warning');
        } else {
            this.timerDisplay.classList.remove('warning');
        }
        
        if (this.gameActive) {
            requestAnimationFrame(() => this.updateTimerDisplay());
        }
    }
    
    displayCards() {
        this.cardsContainer.innerHTML = '';
        
        const groupedCards = this.game.groupAndSortCards();
        
        // Create single row for all cards
        const cardsRow = document.createElement('div');
        cardsRow.className = 'cards-row';
        
        // Display cards grouped by suit in order: spades, hearts, diamonds, clubs
        const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
        
        suitOrder.forEach(suit => {
            const cards = groupedCards[suit];
            
            cards.forEach((card, index) => {
                const cardElement = this.createCardElement(card, index);
                cardsRow.appendChild(cardElement);
            });
        });
        
        this.cardsContainer.appendChild(cardsRow);
    }
    
    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.suit}`;
        cardDiv.style.animationDelay = `${index * 0.05}s`;
        
        const rankSpan = document.createElement('div');
        rankSpan.className = 'card-rank';
        rankSpan.textContent = card.rank;
        
        const suitSpan = document.createElement('div');
        suitSpan.className = 'card-suit';
        suitSpan.textContent = card.suitData.symbol;
        
        cardDiv.appendChild(rankSpan);
        cardDiv.appendChild(suitSpan);
        
        return cardDiv;
    }
    
    updateCounts(hiddenSuit) {
        const counts = this.game.getCardCounts();
        
        for (const suit in counts) {
            const countElement = document.getElementById(`count-${suit}`);
            const boxElement = document.getElementById(`box-${suit}`);
            
            if (countElement && boxElement) {
                countElement.textContent = counts[suit];
                
                // Hide the selected suit count
                if (suit === hiddenSuit) {
                    boxElement.classList.add('hidden');
                } else {
                    boxElement.classList.remove('hidden');
                }
            }
        }
    }
    
    displayAnswerOptions(options) {
        this.currentAnswerOptions = options;
        this.answerButtons.forEach((btn, index) => {
            btn.textContent = options[index];
            btn.dataset.value = options[index];
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }
    
    displayAnswerOptionsDouble(options) {
        this.currentAnswerOptions = options;
        const suitSymbol = this.game.suits[this.game.hiddenSuit].symbol;
        const suitClass = this.game.hiddenSuit; // spades, hearts, diamonds, clubs
        
        this.answerButtonsDouble.forEach((btn, index) => {
            btn.innerHTML = `<span class="${suitClass}">${options[index]} ${suitSymbol}</span>`;
            btn.dataset.value = options[index];
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }
    
    displayAnswerOptionsSum(options) {
        // options is an array of {display: "a + b", value: n}
        this.currentAnswerOptions = options.map(opt => opt.value);
        const suitSymbol = this.game.suits[this.game.hiddenSuit].symbol;
        const suitClass = this.game.hiddenSuit;
        
        this.answerButtonsSum.forEach((btn, index) => {
            btn.innerHTML = `<span class="${suitClass}">${options[index].display} ${suitSymbol}</span>`;
            btn.dataset.value = options[index].value;
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }
    
    updateDoubleHandCounts(countsN, countsS) {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        
        suits.forEach(suit => {
            // Update N hand counts
            const countNElement = document.getElementById(`count-n-${suit}`);
            if (countNElement) {
                countNElement.textContent = countsN[suit];
            }
            
            // Update S hand counts
            const countSElement = document.getElementById(`count-s-${suit}`);
            if (countSElement) {
                countSElement.textContent = countsS[suit];
            }
        });
    }
    
    updateSumHandCounts(countsN, countsS) {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        
        suits.forEach(suit => {
            // Update N hand counts for sum round
            const countNElement = document.getElementById(`count-n-${suit}-sum`);
            if (countNElement) {
                countNElement.textContent = countsN[suit];
            }
            
            // Update S hand counts for sum round
            const countSElement = document.getElementById(`count-s-${suit}-sum`);
            if (countSElement) {
                countSElement.textContent = countsS[suit];
            }
        });
    }
    
    handleAnswer(selectedAnswer) {
        this.gameActive = false;
        this.game.stopTimer();
        
        const isCorrect = selectedAnswer === this.game.correctAnswer;
        
        // Adjust timer for next round
        if (isCorrect) {
            this.game.adjustTimerForCorrect();
        } else {
            this.game.adjustTimerForIncorrect();
        }
        
        // Determine which button set to use
        const buttonsToUse = this.game.currentRoundType === 'sum'
            ? this.answerButtonsSum
            : (this.game.currentRoundType === 'double' 
                ? this.answerButtonsDouble 
                : this.answerButtons);
        
        // Disable all buttons and mark them
        buttonsToUse.forEach(btn => {
            const value = parseInt(btn.dataset.value);
            btn.disabled = true;
            
            if (value === this.game.correctAnswer) {
                btn.classList.add('correct');
            } else if (value === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Reveal the hidden count (only for single hand round)
        if (this.game.currentRoundType === 'single') {
            const boxElement = document.getElementById(`box-${this.game.hiddenSuit}`);
            boxElement.classList.remove('hidden');
        }
        
        // Update score
        if (isCorrect) {
            this.game.score++;
        }
        
        // Show result
        setTimeout(() => {
            this.showResult(isCorrect ? 'correct' : 'incorrect');
        }, 1000);
    }
    
    handleTimeout() {
        this.gameActive = false;
        
        // Timeout is treated as incorrect - adjust timer
        this.game.adjustTimerForIncorrect();
        
        // Determine which button set to use
        const buttonsToUse = this.game.currentRoundType === 'sum'
            ? this.answerButtonsSum
            : (this.game.currentRoundType === 'double' 
                ? this.answerButtonsDouble 
                : this.answerButtons);
        
        // Disable all buttons and mark correct answer
        buttonsToUse.forEach(btn => {
            const value = parseInt(btn.dataset.value);
            btn.disabled = true;
            
            if (value === this.game.correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // Reveal the hidden count (only for single hand round)
        if (this.game.currentRoundType === 'single') {
            const boxElement = document.getElementById(`box-${this.game.hiddenSuit}`);
            boxElement.classList.remove('hidden');
        }
        
        // Show result
        setTimeout(() => {
            this.showResult('timeout');
        }, 500);
    }
    
    showResult(resultType) {
        const messages = {
            correct: '🎉 Correct! Well done!',
            incorrect: '❌ Wrong answer. Try again!',
            timeout: '⏰ Time\'s up! Be faster next time!'
        };
        
        this.resultMessage.innerHTML = `
            ${messages[resultType]}
            <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
                Press SPACE for next round
            </div>
        `;
        this.resultMessage.className = `result-message ${resultType}-result`;
        this.resultSection.style.display = 'block';
        
        // Update score display
        this.scoreDisplay.textContent = `Score: ${this.game.score}`;
        
        // Scroll to bottom and focus on next round button
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            this.nextRoundButton.focus();
        }, 100);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const game = new CardGame();
    const ui = new UIController(game);
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
