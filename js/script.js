document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // Estado da aplicação
    let state = {
        isLoggedIn: false,
        isLoginMode: true, // Começar sempre no modo login
        isMentorMode: false, // Modo de login para mentores
        user: null,
        users: [],
        mentors: [
            {
                id: 'mentor_1',
                fullName: 'Dr. Ana Silva',
                email: 'ana.silva@mentor.com',
                password: 'mentor123',
                expertise: 'Comunicação Efetiva',
                rating: 4.9,
                experience: '10+ anos',
                description: 'Especialista em comunicação corporativa e desenvolvimento de soft skills.',
                avatar: '👩‍💼',
                isOnline: true
            },
            {
                id: 'mentor_2',
                fullName: 'Prof. Carlos Santos',
                email: 'carlos.santos@mentor.com',
                password: 'mentor123',
                expertise: 'Desenvolvimento de Carreira',
                rating: 4.8,
                experience: '8+ anos',
                description: 'Coach de carreira especializado em transições profissionais.',
                avatar: '👨‍💼',
                isOnline: false
            },
            {
                id: 'mentor_3',
                fullName: 'Dra. Maria Costa',
                email: 'maria.costa@mentor.com',
                password: 'mentor123',
                expertise: 'Liderança e Gestão',
                rating: 4.9,
                experience: '12+ anos',
                description: 'Executiva sênior com foco em desenvolvimento de lideranças.',
                avatar: '👩‍💻',
                isOnline: true
            }
        ],
        userProgress: {
            skills: 0,
            mentorSessions: 0,
            completedTasks: 0,
            totalTasks: 10
        },
        showUserMenu: false,
        currentView: 'dashboard', // dashboard, mentors, chat
        selectedMentor: null,
        chatMessages: [],
        searchQuery: ''
    };

    // Carregar dados do localStorage
    function loadState() {
        const savedState = localStorage.getItem('navioState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Sempre começar deslogado para mostrar a tela de login
            state.isLoggedIn = false;
            state.user = null;
            state.users = parsed.users || [];
            state.userProgress = parsed.userProgress || state.userProgress;
            state.chatMessages = parsed.chatMessages || [];
        }
    }

    // Salvar dados no localStorage
    function saveState() {
        localStorage.setItem('navioState', JSON.stringify({
            isLoggedIn: state.isLoggedIn,
            user: state.user,
            users: state.users,
            userProgress: state.userProgress,
            chatMessages: state.chatMessages
        }));
    }

    // Função para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para verificar força da senha
    function checkPasswordStrength(password) {
        let score = 0;
        let message = '';
        let color = 'red';

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123', 'password123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            score = 0;
        }

        switch (score) {
            case 0:
            case 1:
            case 2:
                message = 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.';
                color = 'red';
                break;
            case 3:
                message = 'Adicione um caractere especial para torná-la mais forte.';
                color = 'orange';
                break;
            case 4:
                message = 'Senha boa!';
                color = 'blue';
                break;
            case 5:
                message = 'Senha forte!';
                color = 'green';
                break;
        }

        return {
            score: score * 20,
            message: message,
            color: color,
            isStrong: score >= 4
        };
    }

    // Calcular progresso do usuário
    function calculateProgress() {
        const completed = state.userProgress.completedTasks;
        const total = state.userProgress.totalTasks;
        return Math.round((completed / total) * 100);
    }

    // Função para mostrar notificação
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type === 'success' ? 'bg-green-100 text-green-800' : type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Função para renderizar a aplicação
    function render() {
        if (state.isLoggedIn) {
            if (state.currentView === 'mentors') {
                renderMentorsScreen();
            } else if (state.currentView === 'chat') {
                renderChatScreen();
            } else {
                renderDashboard();
            }
        } else {
            renderLogin();
        }
    }

    // Função para renderizar o login
    function renderLogin() {
        app.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="p-8">
                        <div class="logo-container">
                            <div class="logo-icon">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                </svg>
                            </div>
                            <h1 class="logo-text">Navio</h1>
                        </div>
                        
                        <div class="login-mode-buttons">
                            <button id="student-mode-btn" class="mode-toggle ${!state.isMentorMode ? 'active' : ''}">
                                👨‍🎓 Estudante
                            </button>
                            <button id="mentor-mode-btn" class="mode-toggle ${state.isMentorMode ? 'active' : ''}">
                                👨‍🏫 Mentor
                            </button>
                        </div>

                        <div class="mode-buttons">
                            <button id="login-mode-button" class="mode-button ${state.isLoginMode ? 'active' : ''}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                Entrar
                            </button>
                            <button id="register-mode-button" class="mode-button ${!state.isLoginMode ? 'active' : ''}">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                </svg>
                                Registrar
                            </button>
                        </div>

                        <div id="error-message" class="hidden mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <span id="error-text"></span>
                        </div>

                        <form id="auth-form" class="space-y-4">
                            ${!state.isLoginMode ? `
                                <div>
                                    <input id="fullName" type="text" placeholder="Nome completo" class="input" required>
                                    <div id="fullName-error" class="text-red-500 text-xs mt-1 hidden"></div>
                                </div>
                            ` : ''}
                            
                            <div>
                                <input id="email" type="email" placeholder="Email" class="input" required>
                                <div id="email-error" class="text-red-500 text-xs mt-1 hidden"></div>
                            </div>
                            
                            <div class="relative">
                                <input id="password" type="password" placeholder="Senha" class="input pr-10" required>
                                <button type="button" id="toggle-password" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <svg id="eye-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                </button>
                                <div id="password-error" class="text-red-500 text-xs mt-1 hidden"></div>
                            </div>

                            ${!state.isLoginMode ? `
                                <div>
                                    <div class="mb-2">
                                        <div class="flex justify-between text-xs">
                                            <span id="password-strength-text" class="text-gray-500">Força da senha</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div id="password-strength-bar" class="h-2 rounded-full transition-all duration-300" style="width: 0%; background-color: red;"></div>
                                        </div>
                                        <div id="password-strength-message" class="text-xs mt-1 text-gray-500"></div>
                                    </div>
                                </div>

                                <div class="relative">
                                    <input id="confirmPassword" type="password" placeholder="Confirmar senha" class="input pr-10" required>
                                    <button type="button" id="toggle-confirm-password" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                    <div id="confirmPassword-error" class="text-red-500 text-xs mt-1 hidden"></div>
                                </div>
                            ` : ''}

                            <button type="submit" class="btn btn-primary w-full">
                                ${state.isLoginMode ? 'Entrar' : 'Criar Conta'}
                            </button>
                        </form>

                        <div class="mt-6 space-y-4">
                            <p class="text-center text-sm text-gray-600">
                                ${state.isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                <button id="toggle-mode-button" class="text-primary hover:underline font-medium">${state.isLoginMode ? 'Registre-se aqui' : 'Faça login aqui'}</button>
                            </p>
                            <div class="flex items-center justify-center space-x-2">
                                <hr class="w-full border-gray-300">
                                <span class="text-xs text-gray-500 px-2">OU CONTINUE COM</span>
                                <hr class="w-full border-gray-300">
                            </div>
                            <button id="google-login-button" class="btn btn-outline w-full">
                                <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continuar com Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setupLoginEventListeners();
    }

    // Função para renderizar o dashboard
    function renderDashboard() {
        const progressPercentage = calculateProgress();
        
        app.innerHTML = `
            <header class="flex items-center justify-between p-6">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-primary">Navio</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700">Olá, ${state.user.fullName}!</span>
                    <div class="relative">
                        <button id="user-menu-button" class="user-button">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </button>
                        <div id="user-menu" class="user-menu ${state.showUserMenu ? '' : 'hidden'}">
                            <button id="protected-area-button" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                                Área Protegida
                            </button>
                            <hr class="my-1">
                            <button id="logout-button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main class="container mx-auto px-6 py-8">
                <div class="space-y-8">
                    <div class="card p-8 shadow-lg">
                        <div class="text-center pb-6">
                            <h2 class="text-4xl font-bold mb-4">Bem vindo ao Navio</h2>
                            <p class="text-lg text-gray-600">Encontre seu mentor e comece a aprender</p>
                        </div>
                        <div class="space-y-6">
                            <div class="relative">
                                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                                <input id="mentor-search" placeholder="Pesquise por mentores" class="input pl-10 py-3 text-lg">
                            </div>
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold">Seu progresso:</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-700">Melhore suas habilidades</span>
                                        <span class="text-primary font-semibold">${progressPercentage}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress" style="width: ${progressPercentage}%;"></div>
                                    </div>
                                    <p class="text-sm text-gray-600">${state.userProgress.completedTasks} de ${state.userProgress.totalTasks} tarefas concluídas</p>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold">Funcionalidades Disponíveis</h3>
                                <div class="space-y-3">
                                    <button id="search-mentors-btn" class="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                        <span>Buscar Mentores</span>
                                    </button>
                                    <button id="personalized-tracks-btn" class="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                        </svg>
                                        <span>Trilhas Personalizadas</span>
                                    </button>
                                    <button id="mentoring-sessions-btn" class="w-full flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                        <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                        <span>Sessões de Mentoria</span>
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <h3 class="text-xl font-semibold">Recomendado para você:</h3>
                                <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 class="font-semibold text-lg">Effective communication</h4>
                                        <p class="text-gray-600">Learn how to improve your communication skills</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;
        
        setupDashboardEventListeners();
    }

    // Função para renderizar a tela de mentores
    function renderMentorsScreen() {
        const filteredMentors = state.mentors.filter(mentor => 
            mentor.fullName.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            mentor.expertise.toLowerCase().includes(state.searchQuery.toLowerCase())
        );

        app.innerHTML = `
            <header class="flex items-center justify-between p-6">
                <div class="flex items-center space-x-3">
                    <button id="back-to-dashboard" class="p-2 hover:bg-gray-100 rounded-lg">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-primary">Mentores</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700">Olá, ${state.user.fullName}!</span>
                    <div class="relative">
                        <button id="user-menu-button" class="user-button">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </button>
                        <div id="user-menu" class="user-menu ${state.showUserMenu ? '' : 'hidden'}">
                            <button id="protected-area-button" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                </svg>
                                Área Protegida
                            </button>
                            <hr class="my-1">
                            <button id="logout-button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main class="container mx-auto px-6 py-8">
                <div class="space-y-6">
                    <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div class="relative flex-1 max-w-md">
                            <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <input id="mentor-search-input" placeholder="Buscar mentores..." class="input pl-10" value="${state.searchQuery}">
                        </div>
                        <div class="search-filters">
                            <button class="filter-button active" data-filter="all">Todos</button>
                            <button class="filter-button" data-filter="online">Online</button>
                            <button class="filter-button" data-filter="communication">Comunicação</button>
                            <button class="filter-button" data-filter="career">Carreira</button>
                            <button class="filter-button" data-filter="leadership">Liderança</button>
                        </div>
                    </div>
                    
                    <div class="mentors-grid">
                        ${filteredMentors.map(mentor => `
                            <div class="mentor-card fade-in" data-mentor-id="${mentor.id}">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="mentor-avatar">
                                        ${mentor.avatar}
                                    </div>
                                    <div class="mentor-status ${mentor.isOnline ? 'online' : 'offline'}">
                                        <div class="mentor-status-dot"></div>
                                        ${mentor.isOnline ? 'Online' : 'Offline'}
                                    </div>
                                </div>
                                
                                <h3 class="text-xl font-semibold mb-2">${mentor.fullName}</h3>
                                <p class="text-primary font-medium mb-2">${mentor.expertise}</p>
                                <p class="text-gray-600 text-sm mb-4">${mentor.description}</p>
                                
                                <div class="flex items-center justify-between mb-4">
                                    <div class="mentor-rating">
                                        <span>⭐</span>
                                        <span class="font-medium">${mentor.rating}</span>
                                    </div>
                                    <span class="text-sm text-gray-500">${mentor.experience}</span>
                                </div>
                                
                                <div class="flex gap-2">
                                    <button class="btn btn-primary flex-1 chat-with-mentor" data-mentor-id="${mentor.id}">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                        </svg>
                                        Chat
                                    </button>
                                    <button class="btn btn-outline">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${filteredMentors.length === 0 ? `
                        <div class="text-center py-12">
                            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <h3 class="text-xl font-semibold text-gray-600 mb-2">Nenhum mentor encontrado</h3>
                            <p class="text-gray-500">Tente ajustar sua busca ou filtros</p>
                        </div>
                    ` : ''}
                </div>
            </main>
        `;
        
        setupMentorsEventListeners();
    }

    // Função para renderizar a tela de chat
    function renderChatScreen() {
        if (!state.selectedMentor) {
            state.currentView = 'mentors';
            render();
            return;
        }

        const mentor = state.selectedMentor;
        const chatMessages = state.chatMessages.filter(msg => msg.mentorId === mentor.id);

        app.innerHTML = `
            <header class="flex items-center justify-between p-6">
                <div class="flex items-center space-x-3">
                    <button id="back-to-mentors" class="p-2 hover:bg-gray-100 rounded-lg">
                        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                        <span class="text-2xl">${mentor.avatar}</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-primary">${mentor.fullName}</h1>
                        <p class="text-sm text-gray-600">${mentor.expertise}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="mentor-status ${mentor.isOnline ? 'online' : 'offline'}">
                        <div class="mentor-status-dot"></div>
                        ${mentor.isOnline ? 'Online' : 'Offline'}
                    </div>
                </div>
            </header>
            <main class="container mx-auto px-6 py-4">
                <div class="chat-container">
                    <div class="chat-header">
                        <div class="chat-header-avatar">
                            ${mentor.avatar}
                        </div>
                        <div>
                            <h3 class="font-semibold">${mentor.fullName}</h3>
                            <p class="text-sm opacity-90">${mentor.expertise}</p>
                        </div>
                    </div>
                    
                    <div id="chat-messages" class="chat-messages">
                        ${chatMessages.length === 0 ? `
                            <div class="text-center py-8">
                                <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span class="text-2xl">${mentor.avatar}</span>
                                </div>
                                <h3 class="font-semibold text-gray-700 mb-2">Inicie uma conversa com ${mentor.fullName}</h3>
                                <p class="text-gray-500 text-sm">Faça uma pergunta ou diga olá!</p>
                            </div>
                        ` : chatMessages.map(msg => `
                            <div class="chat-message ${msg.sender}">
                                ${msg.text}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="chat-input-container">
                        <input id="chat-input" type="text" placeholder="Digite sua mensagem..." class="chat-input">
                        <button id="send-message" class="chat-send-button">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </main>
        `;
        
        setupChatEventListeners();
    }

    // Event listeners para login
    function setupLoginEventListeners() {
        // Botões de modo de usuário (Estudante/Mentor)
        document.getElementById('student-mode-btn').addEventListener('click', () => {
            state.isMentorMode = false;
            render();
        });

        document.getElementById('mentor-mode-btn').addEventListener('click', () => {
            state.isMentorMode = true;
            render();
        });

        // Botões de modo (Login/Registro)
        document.getElementById('login-mode-button').addEventListener('click', () => {
            state.isLoginMode = true;
            render();
        });

        document.getElementById('register-mode-button').addEventListener('click', () => {
            state.isLoginMode = false;
            render();
        });

        document.getElementById('toggle-mode-button').addEventListener('click', () => {
            state.isLoginMode = !state.isLoginMode;
            render();
        });

        // Toggle de visibilidade da senha
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const eyeIcon = document.getElementById('eye-icon');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    `;
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    `;
                }
            });
        }

        // Toggle de visibilidade da confirmação de senha
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', () => {
                const confirmPasswordInput = document.getElementById('confirmPassword');
                
                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                } else {
                    confirmPasswordInput.type = 'password';
                }
            });
        }

        // Verificação de força da senha em tempo real
        if (!state.isLoginMode) {
            const passwordInput = document.getElementById('password');
            const strengthBar = document.getElementById('password-strength-bar');
            const strengthText = document.getElementById('password-strength-text');
            const strengthMessage = document.getElementById('password-strength-message');

            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = checkPasswordStrength(password);

                strengthBar.style.width = strength.score + '%';
                strengthBar.style.backgroundColor = strength.color;
                strengthText.textContent = getStrengthText(strength.score);
                strengthText.style.color = strength.color;
                strengthMessage.textContent = strength.message;
                strengthMessage.style.color = strength.color;
            });
        }

        // Formulário de autenticação
        document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

        // Login com Google
        document.getElementById('google-login-button').addEventListener('click', handleGoogleLogin);
    }

    // Event listeners para dashboard
    function setupDashboardEventListeners() {
        // Menu do usuário
        document.getElementById('user-menu-button').addEventListener('click', (e) => {
            e.stopPropagation();
            state.showUserMenu = !state.showUserMenu;
            render();
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', () => {
            if (state.showUserMenu) {
                state.showUserMenu = false;
                render();
            }
        });

        // Área protegida
        document.getElementById('protected-area-button').addEventListener('click', () => {
            renderProtectedArea();
        });

        // Logout
        document.getElementById('logout-button').addEventListener('click', () => {
            state.isLoggedIn = false;
            state.user = null;
            state.showUserMenu = false;
            state.currentView = 'dashboard';
            saveState();
            render();
        });

        // Busca de mentores
        document.getElementById('search-mentors-btn').addEventListener('click', () => {
            state.currentView = 'mentors';
            render();
        });

        // Campo de busca de mentores
        document.getElementById('mentor-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                state.searchQuery = e.target.value;
                state.currentView = 'mentors';
                render();
            }
        });

        // Trilhas personalizadas
        document.getElementById('personalized-tracks-btn').addEventListener('click', () => {
            showNotification('Gerando trilha personalizada com IA...', 'info');
        });

        // Sessões de mentoria
        document.getElementById('mentoring-sessions-btn').addEventListener('click', () => {
            state.userProgress.mentorSessions++;
            saveState();
            showNotification('Sessão de mentoria agendada com sucesso!', 'success');
        });
    }

    // Event listeners para tela de mentores
    function setupMentorsEventListeners() {
        // Voltar ao dashboard
        document.getElementById('back-to-dashboard').addEventListener('click', () => {
            state.currentView = 'dashboard';
            render();
        });

        // Menu do usuário
        document.getElementById('user-menu-button').addEventListener('click', (e) => {
            e.stopPropagation();
            state.showUserMenu = !state.showUserMenu;
            render();
        });

        // Área protegida
        document.getElementById('protected-area-button').addEventListener('click', () => {
            renderProtectedArea();
        });

        // Logout
        document.getElementById('logout-button').addEventListener('click', () => {
            state.isLoggedIn = false;
            state.user = null;
            state.showUserMenu = false;
            state.currentView = 'dashboard';
            saveState();
            render();
        });

        // Busca de mentores
        document.getElementById('mentor-search-input').addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            render();
        });

        // Filtros
        document.querySelectorAll('.filter-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                // Implementar lógica de filtro aqui se necessário
            });
        });

        // Chat com mentores
        document.querySelectorAll('.chat-with-mentor').forEach(button => {
            button.addEventListener('click', () => {
                const mentorId = button.dataset.mentorId;
                state.selectedMentor = state.mentors.find(m => m.id === mentorId);
                state.currentView = 'chat';
                render();
            });
        });
    }

    // Event listeners para chat
    function setupChatEventListeners() {
        // Voltar aos mentores
        document.getElementById('back-to-mentors').addEventListener('click', () => {
            state.currentView = 'mentors';
            render();
        });

        // Enviar mensagem
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');

        function sendMessage() {
            const message = chatInput.value.trim();
            if (message) {
                // Adicionar mensagem do usuário
                state.chatMessages.push({
                    id: Date.now(),
                    mentorId: state.selectedMentor.id,
                    sender: 'user',
                    text: message,
                    timestamp: new Date()
                });

                chatInput.value = '';

                // Simular resposta do mentor após um delay
                setTimeout(() => {
                    const responses = [
                        'Ótima pergunta! Vou te ajudar com isso.',
                        'Entendo sua dúvida. Vamos trabalhar juntos nisso.',
                        'Essa é uma questão importante. Deixe-me explicar...',
                        'Muito bem! Vou compartilhar minha experiência sobre isso.',
                        'Interessante perspectiva! Aqui está o que eu recomendo...'
                    ];
                    
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    
                    state.chatMessages.push({
                        id: Date.now() + 1,
                        mentorId: state.selectedMentor.id,
                        sender: 'mentor',
                        text: randomResponse,
                        timestamp: new Date()
                    });

                    saveState();
                    render();
                }, 1000);

                saveState();
                render();
            }
        }

        sendButton.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Auto-scroll para a última mensagem
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Função para renderizar a área protegida
    function renderProtectedArea() {
        const mainContent = document.getElementById('main-content') || app;
        const progressPercentage = calculateProgress();
        
        mainContent.innerHTML = `
            <div class="card p-8 shadow-lg max-w-4xl mx-auto">
                <div class="text-center pb-6">
                    <h2 class="text-4xl font-bold mb-4">Área Protegida - Dashboard</h2>
                    <p class="text-lg text-gray-600">Bem-vindo à sua área de mentoria personalizada</p>
                </div>
                <div class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <h3 class="text-xl font-semibold">Informações do Usuário</h3>
                            <div class="space-y-2 text-gray-700">
                                <p><strong>ID:</strong> ${state.user.id}</p>
                                <p><strong>Nome:</strong> ${state.user.fullName}</p>
                                <p><strong>Email:</strong> ${state.user.email}</p>
                                <p><strong>Conta criada em:</strong> ${state.user.createdAt}</p>
                                <p><strong>Status:</strong> Ativa</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <h3 class="text-xl font-semibold">Estatísticas</h3>
                            <div class="space-y-2 text-gray-700">
                                <p><strong>Tarefas Concluídas:</strong> ${state.userProgress.completedTasks}</p>
                                <p><strong>Total de Tarefas:</strong> ${state.userProgress.totalTasks}</p>
                                <p><strong>Sessões de Mentoria:</strong> ${state.userProgress.mentorSessions}</p>
                                <p><strong>Nível de Habilidades:</strong> ${state.userProgress.skills}</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-xl font-semibold">Seu Progresso</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700">Melhore suas habilidades</span>
                                <span class="text-primary font-semibold">${progressPercentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progressPercentage}%;"></div>
                            </div>
                            <p class="text-sm text-gray-600">${state.userProgress.completedTasks} de ${state.userProgress.totalTasks} tarefas concluídas</p>
                        </div>
                    </div>
                    <div class="flex space-x-4">
                        <button id="complete-task-btn" class="btn btn-primary">Completar Tarefa</button>
                        <button id="back-to-dashboard-btn" class="btn btn-outline">Voltar ao Dashboard</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners para área protegida
        document.getElementById('complete-task-btn').addEventListener('click', () => {
            if (state.userProgress.completedTasks < state.userProgress.totalTasks) {
                state.userProgress.completedTasks++;
                saveState();
                showNotification('Tarefa concluída! Progresso atualizado.', 'success');
                renderProtectedArea();
            } else {
                showNotification('Todas as tarefas já foram concluídas!', 'info');
            }
        });

        document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
            render();
        });
    }

    // Função para obter texto da força da senha
    function getStrengthText(score) {
        if (score < 40) return 'Fraca';
        if (score < 60) return 'Média';
        if (score < 80) return 'Boa';
        return 'Forte';
    }

    // Função para mostrar erro
    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    // Função para validar campo
    function validateField(fieldId, value, validator, errorMessage) {
        const errorElement = document.getElementById(fieldId + '-error');
        const inputElement = document.getElementById(fieldId);
        
        if (!validator(value)) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('border-red-500');
            return false;
        } else {
            errorElement.classList.add('hidden');
            inputElement.classList.remove('border-red-500');
            return true;
        }
    }

    // Função para lidar com submissão do formulário
    function handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        let isValid = true;

        // Validar email
        isValid &= validateField('email', email, isValidEmail, 'Email inválido');

        // Validar senha
        isValid &= validateField('password', password, (p) => p.length >= 6, 'Senha deve ter pelo menos 6 caracteres');

        if (state.isLoginMode) {
            // Lógica de login
            if (isValid) {
                let user = null;
                
                if (state.isMentorMode) {
                    // Login como mentor
                    user = state.mentors.find(m => m.email === email && m.password === password);
                } else {
                    // Login como estudante
                    user = state.users.find(u => u.email === email && u.password === password);
                }
                
                if (user) {
                    state.isLoggedIn = true;
                    state.user = { ...user };
                    delete state.user.password; // Não manter senha no estado
                    saveState();
                    render();
                } else {
                    showError('Email ou senha inválidos!');
                }
            }
        } else {
            // Lógica de registro
            const fullName = document.getElementById('fullName').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validações adicionais para registro
            isValid &= validateField('fullName', fullName, (n) => n.length >= 2, 'Nome deve ter pelo menos 2 caracteres');
            
            const passwordStrength = checkPasswordStrength(password);
            isValid &= validateField('password', password, () => passwordStrength.isStrong, passwordStrength.message);
            
            isValid &= validateField('confirmPassword', confirmPassword, (cp) => cp === password, 'Senhas não coincidem');

            // Verificar se email já existe (tanto em users quanto em mentors)
            const emailExists = state.users.find(u => u.email === email) || 
                               state.mentors.find(m => m.email === email);
            
            if (emailExists) {
                showError('Este email já está cadastrado!');
                isValid = false;
            }

            if (isValid) {
                // Criar novo usuário
                const newUser = {
                    id: Date.now(),
                    fullName: fullName,
                    email: email,
                    password: password,
                    createdAt: new Date().toLocaleDateString('pt-BR')
                };

                if (state.isMentorMode) {
                    // Registrar como mentor
                    const newMentor = {
                        ...newUser,
                        expertise: 'Área de Especialização',
                        rating: 5.0,
                        experience: '1+ anos',
                        description: 'Novo mentor na plataforma Navio.',
                        avatar: '👨‍🏫',
                        isOnline: true
                    };
                    
                    state.mentors.push(newMentor);
                    state.user = { ...newMentor };
                    delete state.user.password;
                    
                    showNotification('Mentor cadastrado com sucesso!', 'success');
                } else {
                    // Registrar como estudante
                    state.users.push(newUser);
                    state.user = { ...newUser };
                    delete state.user.password;
                    
                    // Inicializar progresso do usuário
                    state.userProgress = {
                        skills: 0,
                        mentorSessions: 0,
                        completedTasks: 1,
                        totalTasks: 10
                    };
                    
                    showNotification('Conta criada com sucesso!', 'success');
                }

                state.isLoggedIn = true;
                saveState();
                render();
            }
        }
    }

    // Função para lidar com login do Google
    function handleGoogleLogin() {
        // Simulação de login com Google
        const googleUser = {
            id: 'google_' + Date.now(),
            fullName: 'Usuário Google',
            email: 'usuario@google.com',
            createdAt: new Date().toLocaleDateString('pt-BR'),
            provider: 'google'
        };

        state.isLoggedIn = true;
        state.user = googleUser;
        
        // Inicializar progresso do usuário Google
        state.userProgress = {
            skills: 2,
            mentorSessions: 1,
            completedTasks: 1,
            totalTasks: 10
        };
        
        saveState();
        render();
    }

    // Inicialização
    loadState();
    render();
});

// script.js

// Exemplo simples: alerta no clique do botão
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("a.bg-blue-600");
  btn.addEventListener("click", () => {
    console.log("Usuário clicou em 'Conheça mais'");
  });
});

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // Estado da aplicação
    let state = {
        isLoggedIn: false,
        isLoginMode: true, // Começar sempre no modo login
        user: null,
        users: [],
        userProgress: {
            skills: 0,
            mentorSessions: 0,
            completedTasks: 0,
            totalTasks: 10
        },
        showUserMenu: false
    };

    // Carregar dados do localStorage
    function loadState() {
        const savedState = localStorage.getItem('navioState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            state.isLoggedIn = parsed.isLoggedIn || false;
            state.user = parsed.user || null;
            state.users = parsed.users || [];
            state.userProgress = parsed.userProgress || state.userProgress;
        }
    }

    // Salvar dados no localStorage
    function saveState() {
        localStorage.setItem('navioState', JSON.stringify({
            isLoggedIn: state.isLoggedIn,
            user: state.user,
            users: state.users,
            userProgress: state.userProgress
        }));
    }

    // Função para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para verificar força da senha
    function checkPasswordStrength(password) {
        let score = 0;
        let message = '';
        let color = 'red';

        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const commonPasswords = ['123456', 'password', '123456789', 'qwerty', 'abc123', 'password123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            score = 0;
        }

        switch (score) {
            case 0:
            case 1:
            case 2:
                message = 'A senha deve ter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.';
                color = 'red';
                break;
            case 3:
                message = 'Adicione um caractere especial para torná-la mais forte.';
                color = 'orange';
                break;
            case 4:
                message = 'Senha boa!';
                color = 'blue';
                break;
            case 5:
                message = 'Senha forte!';
                color = 'green';
                break;
        }

        return {
            score: score * 20,
            message: message,
            color: color,
            isStrong: score >= 4
        };
    }

    // Calcular progresso do usuário
    function calculateProgress() {
        const completed = state.userProgress.completedTasks;
        const total = state.userProgress.totalTasks;
        return Math.round((completed / total) * 100);
    }

    // Função para renderizar a aplicação
    function render() {
        if (state.isLoggedIn) {
            renderDashboard();
        } else {
            renderLogin();
        }
    }

    // Função para renderizar o dashboard
    function renderDashboard() {
        const progressPercentage = calculateProgress();
        
        app.innerHTML = `
            <header class="flex items-center justify-between p-6">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                        </svg>
                    </div>
                    <h1 class="text-3xl font-bold text-primary">Navio</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700">Olá, ${state.user.fullName}!</span>
                    <div class="relative">
                        <button id="user-menu-button" class="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                        </button>
                        <div id="user-menu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border ${state.showUserMenu ? '' : 'hidden'}">
                            <div class="py-1">
                                <button id="protected-area-button" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                    Área Protegida
                                </button>
                                <button id="profile-button" class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                    Meu Perfil
                                </button>
                                <hr class="my-1">
                                <button id="logout-button" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                    </svg>
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main class="container mx-auto px-6 py-8">
                <div id="main-content">
                    <div class="space-y-8">
                        <div class="card p-8 shadow-lg">
                            <div class="text-center pb-6">
                                <h2 class="text-4xl font-bold mb-4">Bem vindo ao Navio</h2>
                                <p class="text-lg text-gray-600">Encontre seu mentor e começe seu aprendizado</p>
                            </div>
                            <div class="space-y-6">
                                <div class="relative">
                                    <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <input id="mentor-search" placeholder="Busque por mentores" class="input pl-10 py-3 text-lg">
                                </div>
                                <div class="space-y-4">
                                    <h3 class="text-xl font-semibold">Seu Progresso</h3>
                                    <div class="space-y-3">
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-700">Enhance your skills</span>
                                            <span class="text-primary font-semibold">${progressPercentage}%</span>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress" style="width: ${progressPercentage}%;"></div>
                                        </div>
                                        <p class="text-sm text-gray-600">${state.userProgress.completedTasks} de ${state.userProgress.totalTasks} tarefas concluídas</p>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                    <h3 class="text-xl font-semibold">Funcionalidades Disponíveis</h3>
                                    <div class="space-y-3">
                                        <button id="search-mentors-btn" class="w-full flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                            <span>Buscar Mentores</span>
                                        </button>
                                        <button id="personalized-tracks-btn" class="w-full flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                            </svg>
                                            <span>Trilhas Personalizadas</span>
                                        </button>
                                        <button id="mentoring-sessions-btn" class="w-full flex items-center space-x-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            <span>Sessões de Mentoria</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="space-y-4">
                                    <h3 class="text-xl font-semibold">Recommended</h3>
                                    <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-lg">Effective communication</h4>
                                            <p class="text-gray-600">Learn how to improve your communication skills</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;
        
        setupDashboardEventListeners();
    }

    // Função para renderizar a área protegida
    function renderProtectedArea() {
        const mainContent = document.getElementById('main-content');
        const progressPercentage = calculateProgress();
        
        mainContent.innerHTML = `
            <div class="card p-8 shadow-lg max-w-4xl mx-auto">
                <div class="text-center pb-6">
                    <h2 class="text-4xl font-bold mb-4">Área Protegida - Dashboard</h2>
                    <p class="text-lg text-gray-600">Bem-vindo à sua área de mentoria personalizada</p>
                </div>
                <div class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <h3 class="text-xl font-semibold">Informações do Usuário</h3>
                            <div class="space-y-2 text-gray-700">
                                <p><strong>ID:</strong> ${state.user.id}</p>
                                <p><strong>Nome:</strong> ${state.user.fullName}</p>
                                <p><strong>Email:</strong> ${state.user.email}</p>
                                <p><strong>Conta criada em:</strong> ${state.user.createdAt}</p>
                                <p><strong>Status:</strong> Ativa</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <h3 class="text-xl font-semibold">Estatísticas</h3>
                            <div class="space-y-2 text-gray-700">
                                <p><strong>Tarefas Concluídas:</strong> ${state.userProgress.completedTasks}</p>
                                <p><strong>Total de Tarefas:</strong> ${state.userProgress.totalTasks}</p>
                                <p><strong>Sessões de Mentoria:</strong> ${state.userProgress.mentorSessions}</p>
                                <p><strong>Nível de Habilidades:</strong> ${state.userProgress.skills}</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <h3 class="text-xl font-semibold">Seu Progresso</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-700">Enhance your skills</span>
                                <span class="text-primary font-semibold">${progressPercentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${progressPercentage}%;"></div>
                            </div>
                            <p class="text-sm text-gray-600">${state.userProgress.completedTasks} de ${state.userProgress.totalTasks} tarefas concluídas</p>
                        </div>
                    </div>
                    <div class="flex space-x-4">
                        <button id="complete-task-btn" class="btn btn-primary">Completar Tarefa</button>
                        <button id="back-to-dashboard-btn" class="btn btn-outline">Voltar ao Dashboard</button>
                    </div>
                </div>
            </div>
        `;

        // Event listeners para a área protegida
        document.getElementById('complete-task-btn').addEventListener('click', () => {
            if (state.userProgress.completedTasks < state.userProgress.totalTasks) {
                state.userProgress.completedTasks++;
                saveState();
                renderProtectedArea(); // Re-render para atualizar o progresso
                showNotification('Tarefa concluída! Progresso atualizado.', 'success');
            } else {
                showNotification('Todas as tarefas já foram concluídas!', 'info');
            }
        });

        document.getElementById('back-to-dashboard-btn').addEventListener('click', () => {
            renderDashboard();
        });
    }

    // Função para mostrar notificações
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Event listeners para o dashboard
    function setupDashboardEventListeners() {
        // Menu do usuário
        document.getElementById('user-menu-button').addEventListener('click', (e) => {
            e.stopPropagation();
            state.showUserMenu = !state.showUserMenu;
            const menu = document.getElementById('user-menu');
            menu.classList.toggle('hidden', !state.showUserMenu);
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', () => {
            if (state.showUserMenu) {
                state.showUserMenu = false;
                const menu = document.getElementById('user-menu');
                if (menu) menu.classList.add('hidden');
            }
        });

        // Área protegida
        document.getElementById('protected-area-button').addEventListener('click', () => {
            state.showUserMenu = false;
            document.getElementById('user-menu').classList.add('hidden');
            renderProtectedArea();
        });

        // Perfil
        document.getElementById('profile-button').addEventListener('click', () => {
            state.showUserMenu = false;
            document.getElementById('user-menu').classList.add('hidden');
            showNotification('Funcionalidade de perfil em desenvolvimento!', 'info');
        });

        // Logout
        document.getElementById('logout-button').addEventListener('click', () => {
            state.isLoggedIn = false;
            state.user = null;
            state.showUserMenu = false;
            saveState();
            render();
        });

        // Funcionalidades disponíveis
        document.getElementById('search-mentors-btn').addEventListener('click', () => {
            showNotification('Buscando mentores disponíveis...', 'info');
            // Simular busca
            setTimeout(() => {
                showNotification('3 mentores encontrados! Funcionalidade em desenvolvimento.', 'success');
            }, 1500);
        });

        document.getElementById('personalized-tracks-btn').addEventListener('click', () => {
            showNotification('Gerando trilha personalizada com IA...', 'info');
            setTimeout(() => {
                showNotification('Trilha personalizada criada! Funcionalidade em desenvolvimento.', 'success');
            }, 2000);
        });

        document.getElementById('mentoring-sessions-btn').addEventListener('click', () => {
            showNotification('Agendando sessão de mentoria...', 'info');
            setTimeout(() => {
                state.userProgress.mentorSessions++;
                saveState();
                showNotification('Sessão agendada com sucesso!', 'success');
            }, 1000);
        });

        // Busca de mentores
        document.getElementById('mentor-search').addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length > 2) {
                showNotification(`Buscando por: "${query}"...`, 'info');
            }
        });
    }

    // Função para renderizar a tela de login/registro
    function renderLogin() {
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                <div class="w-full max-w-md">
                    <div class="text-center mb-8">
                        <div class="flex items-center justify-center space-x-3 mb-6">
                            <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                </svg>
                            </div>
                            <h1 class="text-4xl font-bold text-primary">Navio</h1>
                        </div>
                        <p class="text-lg text-gray-600">Plataforma de Mentoria com IA</p>
                    </div>
                    
                    <div class="card shadow-lg">
                        <div class="text-center p-6">
                            <div class="flex space-x-2 mb-6">
                                <button id="login-mode-button" class="btn flex-1 ${state.isLoginMode ? 'btn-primary' : 'btn-outline'}">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                    </svg>
                                    Login
                                </button>
                                <button id="register-mode-button" class="btn flex-1 ${!state.isLoginMode ? 'btn-primary' : 'btn-outline'}">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                                    </svg>
                                    Registrar
                                </button>
                            </div>
                            <h2 class="text-2xl font-bold mb-2">${state.isLoginMode ? 'Fazer Login' : 'Criar Conta'}</h2>
                            <p class="text-gray-600">${state.isLoginMode ? 'Entre na sua conta para continuar' : 'Crie sua conta e comece a aprender'}</p>
                        </div>
                        
                        <div class="p-6 space-y-4">
                            <div id="error-message" class="hidden p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div class="flex items-center">
                                    <svg class="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <span id="error-text" class="text-red-600 text-sm"></span>
                                </div>
                            </div>
                            <form id="auth-form" class="space-y-4">
                                ${!state.isLoginMode ? `
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-gray-700">Nome completo</label>
                                        <input id="fullName" placeholder="Seu nome completo" class="input" required>
                                        <span id="fullName-error" class="text-red-500 text-xs hidden"></span>
                                    </div>
                                ` : ''}
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-gray-700">Email</label>
                                    <input id="email" type="email" placeholder="seu@email.com" class="input" required>
                                    <span id="email-error" class="text-red-500 text-xs hidden"></span>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-sm font-medium text-gray-700">Senha</label>
                                    <div class="relative">
                                        <input id="password" type="password" placeholder="Sua senha" class="input pr-10" required>
                                        <button type="button" id="toggle-password" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <svg id="eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                        </button>
                                    </div>
                                    <span id="password-error" class="text-red-500 text-xs hidden"></span>
                                    ${!state.isLoginMode ? `
                                        <div class="space-y-2">
                                            <div class="flex justify-between items-center text-xs">
                                                <span class="text-gray-600">Força da senha:</span>
                                                <span id="password-strength-text" class="font-medium"></span>
                                            </div>
                                            <div class="progress-bar">
                                                <div id="password-strength-bar" class="progress" style="width: 0%;"></div>
                                            </div>
                                            <p id="password-strength-message" class="text-xs text-gray-600"></p>
                                        </div>
                                    ` : ''}
                                </div>
                                ${!state.isLoginMode ? `
                                    <div class="space-y-2">
                                        <label class="text-sm font-medium text-gray-700">Confirmar senha</label>
                                        <div class="relative">
                                            <input id="confirmPassword" type="password" placeholder="Confirme sua senha" class="input pr-10" required>
                                            <button type="button" id="toggle-confirm-password" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <span id="confirmPassword-error" class="text-red-500 text-xs hidden"></span>
                                    </div>
                                ` : ''}
                                <button type="submit" id="submit-button" class="btn btn-primary w-full">
                                    ${state.isLoginMode ? 'Entrar' : 'Criar Conta'}
                                </button>
                            </form>
                            <p class="text-center text-sm text-gray-600">
                                ${state.isLoginMode ? 'Não tem conta?' : 'Já tem conta?'}
                                <button id="toggle-mode-button" class="text-primary hover:underline font-medium">${state.isLoginMode ? 'Registre-se aqui' : 'Faça login aqui'}</button>
                            </p>
                            <div class="flex items-center justify-center space-x-2">
                                <hr class="w-full border-gray-300">
                                <span class="text-xs text-gray-500 px-2">OU CONTINUE COM</span>
                                <hr class="w-full border-gray-300">
                            </div>
                            <button id="google-login-button" class="btn btn-outline w-full">
                                <svg class="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continuar com Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setupLoginEventListeners();
    }

    // Event listeners para login
    function setupLoginEventListeners() {
        // Botões de modo
        document.getElementById('login-mode-button').addEventListener('click', () => {
            state.isLoginMode = true;
            render();
        });

        document.getElementById('register-mode-button').addEventListener('click', () => {
            state.isLoginMode = false;
            render();
        });

        document.getElementById('toggle-mode-button').addEventListener('click', () => {
            state.isLoginMode = !state.isLoginMode;
            render();
        });

        // Toggle de visibilidade da senha
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const eyeIcon = document.getElementById('eye-icon');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    `;
                } else {
                    passwordInput.type = 'password';
                    eyeIcon.innerHTML = `
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    `;
                }
            });
        }

        // Toggle de visibilidade da confirmação de senha
        const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
        if (toggleConfirmPassword) {
            toggleConfirmPassword.addEventListener('click', () => {
                const confirmPasswordInput = document.getElementById('confirmPassword');
                
                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                } else {
                    confirmPasswordInput.type = 'password';
                }
            });
        }

        // Verificação de força da senha em tempo real
        if (!state.isLoginMode) {
            const passwordInput = document.getElementById('password');
            const strengthBar = document.getElementById('password-strength-bar');
            const strengthText = document.getElementById('password-strength-text');
            const strengthMessage = document.getElementById('password-strength-message');

            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = checkPasswordStrength(password);

                strengthBar.style.width = strength.score + '%';
                strengthBar.style.backgroundColor = strength.color;
                strengthText.textContent = getStrengthText(strength.score);
                strengthText.style.color = strength.color;
                strengthMessage.textContent = strength.message;
                strengthMessage.style.color = strength.color;
            });
        }

        // Formulário de autenticação
        document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);

        // Login com Google
        document.getElementById('google-login-button').addEventListener('click', handleGoogleLogin);
    }

    // Função para obter texto da força da senha
    function getStrengthText(score) {
        if (score < 40) return 'Fraca';
        if (score < 60) return 'Média';
        if (score < 80) return 'Boa';
        return 'Forte';
    }

    // Função para mostrar erro
    function showError(message) {
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    // Função para validar campo
    function validateField(fieldId, value, validator, errorMessage) {
        const errorElement = document.getElementById(fieldId + '-error');
        const inputElement = document.getElementById(fieldId);
        
        if (!validator(value)) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('border-red-500');
            return false;
        } else {
            errorElement.classList.add('hidden');
            inputElement.classList.remove('border-red-500');
            return true;
        }
    }

    // Função para lidar com submissão do formulário
    function handleAuthSubmit(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        let isValid = true;

        // Validar email
        isValid &= validateField('email', email, isValidEmail, 'Email inválido');

        // Validar senha
        isValid &= validateField('password', password, (p) => p.length >= 6, 'Senha deve ter pelo menos 6 caracteres');

        if (state.isLoginMode) {
            // Lógica de login
            if (isValid) {
                const user = state.users.find(u => u.email === email && u.password === password);
                
                if (user) {
                    state.isLoggedIn = true;
                    state.user = { ...user };
                    delete state.user.password; // Não manter senha no estado
                    saveState();
                    render();
                } else {
                    showError('Email ou senha inválidos!');
                }
            }
        } else {
            // Lógica de registro
            const fullName = document.getElementById('fullName').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Validações adicionais para registro
            isValid &= validateField('fullName', fullName, (n) => n.length >= 2, 'Nome deve ter pelo menos 2 caracteres');
            
            const passwordStrength = checkPasswordStrength(password);
            isValid &= validateField('password', password, () => passwordStrength.isStrong, passwordStrength.message);
            
            isValid &= validateField('confirmPassword', confirmPassword, (cp) => cp === password, 'Senhas não coincidem');

            // Verificar se email já existe
            if (state.users.find(u => u.email === email)) {
                showError('Este email já está cadastrado!');
                isValid = false;
            }

            if (isValid) {
                // Criar novo usuário
                const newUser = {
                    id: Date.now(),
                    fullName: fullName,
                    email: email,
                    password: password,
                    createdAt: new Date().toLocaleDateString('pt-BR')
                };

                state.users.push(newUser);
                state.isLoggedIn = true;
                state.user = { ...newUser };
                delete state.user.password; // Não manter senha no estado
                
                // Inicializar progresso do usuário
                state.userProgress = {
                    skills: 0,
                    mentorSessions: 0,
                    completedTasks: 0,
                    totalTasks: 10
                };
                
                saveState();
                render();
            }
        }
    }

    // Função para lidar com login do Google
    function handleGoogleLogin() {
        // Simulação de login com Google
        const googleUser = {
            id: 'google_' + Date.now(),
            fullName: 'Usuário Google',
            email: 'usuario@google.com',
            createdAt: new Date().toLocaleDateString('pt-BR'),
            provider: 'google'
        };

        state.isLoggedIn = true;
        state.user = googleUser;
        
        // Inicializar progresso do usuário Google
        state.userProgress = {
            skills: 2,
            mentorSessions: 1,
            completedTasks: 3,
            totalTasks: 10
        };
        
        saveState();
        render();
    }

    // Inicialização
    loadState();
    render();
});


