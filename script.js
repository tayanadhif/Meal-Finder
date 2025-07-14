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
            this.currentMeals = data.meals || [];
            this.displaySearchResults();
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            this.hideLoading();
        }
    }