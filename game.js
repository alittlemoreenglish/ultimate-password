class SecretNumberGame {
  constructor() {
    this.minRange = 0;
    this.maxRange = 100;
    this.playerCount = 2;
    this.currentPlayerIndex = 0;
    this.players = [];
    this.playerAvatars = [];
    this.secretNumber = null;
    this.currentMinRange = null;
    this.currentMaxRange = null;
    this.avatarLoadPromises = [];

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('start-game').addEventListener('click', () => this.startGame());
    document.getElementById('submit-guess').addEventListener('click', () => this.processGuess());
    document.getElementById('guess-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.processGuess();
    });
  }

  async generateAvatar(seed) {
    try {
      const pokemonId = Math.floor(Math.random() * 898) + 1;
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Pokemon API response not ok');
      }

      const pokemonData = await response.json();
      
      // Verify sprite URL exists
      if (!pokemonData.sprites?.front_default) {
        throw new Error('No sprite available');
      }

      return {
        name: pokemonData.name,
        sprite: pokemonData.sprites.front_default,
        colors: this.getColorPaletteFromSprite(pokemonData.sprites.front_default)
      };
    } catch (error) {
      console.error('Failed to fetch Pokémon:', error);
      // Fallback to emoji avatar
      const emojis = ['🤠', '🚀', '🌟', '🍄', '🎲', '🌈', '🍦', '🐸', '🤖', '🍩'];
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', 
        '#6C5CE7', '#A8E6CF', '#FF8ED4', '#FAD390'
      ];

      return {
        name: `Player ${seed + 1}`,
        emoji: emojis[seed % emojis.length],
        color: colors[seed % colors.length]
      };
    }
  }

  async startGame() {
    this.minRange = parseInt(document.getElementById('min-range').value);
    this.maxRange = parseInt(document.getElementById('max-range').value);
    this.playerCount = parseInt(document.getElementById('player-count').value);

    this.showLoadingOverlay();

    this.secretNumber = this.generateSecretNumber(this.minRange, this.maxRange);
    
    // Reset arrays
    this.players = [];
    this.playerAvatars = [];
    this.avatarLoadPromises = [];
    
    // Create a promise that resolves after 10 seconds as a fallback
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 10000); // 10 second timeout
    });

    try {
      // Generate all avatars with a maximum total time of 10 seconds
      for (let i = 0; i < this.playerCount; i++) {
        this.players.push(`Player ${i + 1}`);
        const avatarPromise = Promise.race([
          this.generateAvatar(i),
          timeoutPromise
        ]);
        this.avatarLoadPromises.push(avatarPromise);
      }

      // Wait for all avatars or timeouts
      this.playerAvatars = await Promise.all(this.avatarLoadPromises);
      
      // Replace any null results (from timeout) with emoji fallbacks
      this.playerAvatars = this.playerAvatars.map((avatar, index) => {
        if (!avatar) {
          const emojis = ['🤠', '🚀', '🌟', '🍄', '🎲', '🌈', '🍦', '🐸', '🤖', '🍩'];
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7'];
          return {
            name: `Player ${index + 1}`,
            emoji: emojis[index % emojis.length],
            color: colors[index % colors.length]
          };
        }
        return avatar;
      });

      // Set up game state
      this.currentMinRange = this.minRange;
      this.currentMaxRange = this.maxRange;

      // Update UI
      document.getElementById('game-setup').classList.add('hidden');
      document.getElementById('game-area').classList.remove('hidden');
      this.currentPlayerIndex = 0;
      this.updateCurrentPlayerDisplay();
      this.updateRangeDisplay();
      document.getElementById('game-feedback').textContent = 
        `Game started! Please choose a number between ${this.currentMinRange + 1} and ${this.currentMaxRange - 1}`;
    } catch (error) {
      console.error('Error during game setup:', error);
      document.getElementById('game-feedback').textContent = 'Error starting game. Please try again.';
    } finally {
      this.hideLoadingOverlay();
    }
  }

  processGuess() {
    const guessInput = document.getElementById('guess-input');
    const guess = parseInt(guessInput.value);
    const feedbackElement = document.getElementById('game-feedback');

    // 驗證猜測：不能選擇範圍的上限和下限
    if (
      isNaN(guess) || 
      guess <= this.currentMinRange || 
      guess >= this.currentMaxRange
    ) {
      feedbackElement.textContent = 
        `Please enter a valid number between ${this.currentMinRange + 1} and ${this.currentMaxRange - 1}`;
      return;
    }

    if (guess === this.secretNumber) {
      // 猜中密碼，該玩家輸了
      this.showCelebrationMessage(this.players[this.currentPlayerIndex]);
    } else if (guess < this.secretNumber) {
      // 更新最小範圍
      this.currentMinRange = guess;
      feedbackElement.textContent = 
        `Too low! The number is between ${guess} and ${this.currentMaxRange - 1}`;
      this.updateRangeDisplay();
      this.nextPlayer();
    } else {
      // 更新最大範圍
      this.currentMaxRange = guess;
      feedbackElement.textContent = 
        `Too high! The number is between ${this.currentMinRange + 1} and ${guess}`;
      this.updateRangeDisplay();
      this.nextPlayer();
    }

    guessInput.value = '';
    guessInput.focus();
  }

  updateRangeDisplay() {
    document.getElementById('current-range').textContent = 
      `Current Range: ${this.currentMinRange} - ${this.currentMaxRange}`;
  }

  updateCurrentPlayerDisplay() {
    const playerNameElement = document.getElementById('current-player-name');
    const playerBanner = document.getElementById('current-player-info');
    const playerAvatarElement = document.getElementById('current-player-avatar');
    
    playerBanner.className = 'player-banner';
    playerBanner.classList.add(`player-banner-${this.currentPlayerIndex + 1}`);
    
    playerNameElement.textContent = this.players[this.currentPlayerIndex];
    
    const currentAvatar = this.playerAvatars[this.currentPlayerIndex];
    
    if (currentAvatar.sprite) {
      playerAvatarElement.innerHTML = `<img src="${currentAvatar.sprite}" alt="${currentAvatar.name}" style="max-width: 100%; max-height: 100%;">`;
      playerAvatarElement.style.backgroundColor = currentAvatar.colors;
    } else {
      playerAvatarElement.textContent = currentAvatar.emoji;
      playerAvatarElement.style.backgroundColor = currentAvatar.color;
    }
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount;
    this.updateCurrentPlayerDisplay();
  }

  showCelebrationMessage(losingPlayer) {
    const celebrationContainer = document.createElement('div');
    celebrationContainer.style.position = 'fixed';
    celebrationContainer.style.top = '0';
    celebrationContainer.style.left = '0';
    celebrationContainer.style.width = '100%';
    celebrationContainer.style.height = '100%';
    celebrationContainer.style.zIndex = '1000';
    celebrationContainer.style.display = 'flex';
    celebrationContainer.style.flexDirection = 'column';
    celebrationContainer.style.justifyContent = 'center';
    celebrationContainer.style.alignItems = 'center';
    celebrationContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
    celebrationContainer.style.color = 'white';
    celebrationContainer.style.fontFamily = 'Arial, sans-serif';
    celebrationContainer.style.textAlign = 'center';

    // Winner announcement
    const winnerMessage = document.createElement('h1');
    winnerMessage.textContent = `🏆 The winner is ${winningPlayer}, who correctly guessed the secret number: ${this.secretNumber}! 🎉`;
    winnerMessage.style.fontSize = '2.5rem';
    winnerMessage.style.marginBottom = '20px';

    // Confetti animation (similar to previous implementation)
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.overflow = 'hidden';

    // Create multiple confetti elements
    for (let i = 0; i < 200; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '50%';
      
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#fdcb6e', '#6c5ce7', '#a8e6cf', '#ff8ed4', '#fad390'];
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.left = `${Math.random() * 100}%`;
      
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 2000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        delay: Math.random() * 1000
      });

      confettiContainer.appendChild(confetti);
    }

    celebrationContainer.appendChild(winnerMessage);
    celebrationContainer.appendChild(confettiContainer);
    document.body.appendChild(celebrationContainer);
    
    setTimeout(() => {
      document.body.removeChild(celebrationContainer);
      this.resetGame();
    }, 5000);
  }

  showLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.remove('hidden');
  }

  hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('hidden');
  }

  resetGame() {
    document.getElementById('game-area').classList.add('hidden');
    document.getElementById('game-setup').classList.remove('hidden');
  }
}

// Initialize the game
window.game = new SecretNumberGame();
