
class MealFinder {
    constructor() {
        this.apiUrl = 'https://www.themealdb.com/api/json/v1/1/';
        this.favorites = this.loadFavorites();
        this.currentMeals = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.displayFavorites();
    }

    setupEventListeners() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const modal = document.getElementById('mealModal');
        const closeBtn = modal.querySelector('.close');

        searchBtn.addEventListener('click', () => this.searchMeals());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchMeals();
        });

        closeBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        sortSelect.addEventListener('change', () => this.sortMeals());
    }

    async searchMeals() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (!searchTerm) return;

        this.showLoading();
        try {
            const response = await fetch(`${this.apiUrl}search.php?s=${searchTerm}`);
            const data = await response.json();
            
            if (data.meals) {
                this.displayMeals(data.meals);
            } else {
                this.displayNoResults();
            }
        } catch (error) {
            console.error('Error searching meals:', error);
            this.displayError();
        }
        this.hideLoading();
    }

    displayMeals(meals) {
        const container = document.getElementById('mealsContainer');
        const resultsTitle = document.getElementById('resultsTitle');
        const sortControls = document.getElementById('sortControls');
        
        this.currentMeals = meals;
        
        resultsTitle.style.display = 'block';
        sortControls.style.display = 'block';
        resultsTitle.scrollIntoView({ behavior: 'smooth' });
        
        container.innerHTML = meals.map((meal, index) => this.createMealCard(meal, index)).join('');
    }

    createMealCard(meal, index = 0) {
        const isFavorite = this.favorites.some(fav => fav.idMeal === meal.idMeal);
        const animationDelay = index * 0.1;
        
        return `
            <div class="meal-card" onclick="mealFinder.showMealDetails('${meal.idMeal}')" 
                 style="animation-delay: ${animationDelay}s">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy">
                <div class="meal-info">
                    <h3>${meal.strMeal}</h3>
                    <p><strong>Category:</strong> ${meal.strCategory}</p>
                    <p><strong>Area:</strong> ${meal.strArea}</p>
                    <div class="meal-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                                onclick="event.stopPropagation(); mealFinder.toggleFavorite('${meal.idMeal}', this)">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async showMealDetails(mealId) {
        this.showLoading();
        try {
            const response = await fetch(`${this.apiUrl}lookup.php?i=${mealId}`);
            const data = await response.json();
            
            if (data.meals && data.meals[0]) {
                this.displayMealDetails(data.meals[0]);
            }
        } catch (error) {
            console.error('Error fetching meal details:', error);
        }
        this.hideLoading();
    }

    displayMealDetails(meal) {
        const modal = document.getElementById('mealModal');
        const detailsContainer = document.getElementById('mealDetails');
        
        const ingredients = this.getIngredients(meal);
        const isFavorite = this.favorites.some(fav => fav.idMeal === meal.idMeal);
        
        detailsContainer.innerHTML = `
            <div class="meal-detail">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
                <h2>${meal.strMeal}</h2>
                <span class="category">${meal.strCategory}</span>
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        onclick="mealFinder.toggleFavorite('${meal.idMeal}', this)"
                        style="float: right; font-size: 1.5rem;">
                    <i class="fas fa-heart"></i>
                </button>
                
                <div class="ingredients">
                    <h3>Ingredients</h3>
                    <ul>
                        ${ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="instructions">
                    <h3>Instructions</h3>
                    <p>${meal.strInstructions}</p>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    getIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
            }
        }
        return ingredients;
    }

    async toggleFavorite(mealId, button) {
        const existingIndex = this.favorites.findIndex(fav => fav.idMeal === mealId);
        
        // Add pulse animation
        button.classList.add('pulse-animation');
        setTimeout(() => button.classList.remove('pulse-animation'), 600);
        
        if (existingIndex > -1) {
            this.favorites.splice(existingIndex, 1);
            button.classList.remove('active');
        } else {
            try {
                const response = await fetch(`${this.apiUrl}lookup.php?i=${mealId}`);
                const data = await response.json();
                
                if (data.meals && data.meals[0]) {
                    this.favorites.push(data.meals[0]);
                    button.classList.add('active');
                }
            } catch (error) {
                console.error('Error adding to favorites:', error);
            }
        }
        
        this.saveFavorites();
        this.displayFavorites();
    }

    displayFavorites() {
        const container = document.getElementById('favoritesContainer');
        
        if (this.favorites.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No favorite meals yet. Start searching and add some!</p>';
            return;
        }
        
        container.innerHTML = this.favorites.map((meal, index) => this.createMealCard(meal, index)).join('');
    }

    sortMeals() {
        const sortValue = document.getElementById('sortSelect').value;
        let sortedMeals = [...this.currentMeals];
        
        switch (sortValue) {
            case 'name':
                sortedMeals.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
                break;
            case 'name-desc':
                sortedMeals.sort((a, b) => b.strMeal.localeCompare(a.strMeal));
                break;
            case 'category':
                sortedMeals.sort((a, b) => a.strCategory.localeCompare(b.strCategory));
                break;
            case 'area':
                sortedMeals.sort((a, b) => a.strArea.localeCompare(b.strArea));
                break;
        }
        
        const container = document.getElementById('mealsContainer');
        container.innerHTML = sortedMeals.map((meal, index) => this.createMealCard(meal, index)).join('');
    }

    displayNoResults() {
        const container = document.getElementById('mealsContainer');
        const resultsTitle = document.getElementById('resultsTitle');
        
        resultsTitle.style.display = 'block';
        resultsTitle.textContent = 'No Results Found';
        resultsTitle.scrollIntoView({ behavior: 'smooth' });
        
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.2rem;">No meals found. Try a different search term.</p>
            </div>
        `;
    }

    displayError() {
        const container = document.getElementById('mealsContainer');
        const resultsTitle = document.getElementById('resultsTitle');
        
        resultsTitle.style.display = 'block';
        resultsTitle.textContent = 'Error';
        
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.2rem;">Something went wrong. Please try again.</p>
            </div>
        `;
    }

    closeModal() {
        document.getElementById('mealModal').style.display = 'none';
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('mealFavorites');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('mealFavorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mealFinder = new MealFinder();
});
