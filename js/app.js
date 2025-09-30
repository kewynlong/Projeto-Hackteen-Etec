
        
        this.init();
    }

    init() {
        this.loadState();
        this.render();
    }

    loadState() {
        const savedState = localStorage.getItem('navioState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            this.state.users = parsed.users || [];
            this.state.chatMessages = parsed.chatMessages || [];
            // Sempre começar deslogado
            this.state.isLoggedIn = false;
            this.state.user = null;
        }
    }

    saveState() {
        localStorage.setItem('navioState', JSON.stringify({
            users: this.state.users,
            chatMessages: this.state.chatMessages
        }));
    }

    // Autenticação
    login(email, password) {
        // Verificar se é mentor
        if (this.state.isMentorMode) {
            const mentor = this.state.mentors.find(m => m.email === email && m.password === password);
            if (mentor) {
                this.state.user = { ...mentor, type: 'mentor' };
                this.state.isLoggedIn = true;
                this.state.currentView = 'mentor-dashboard';
                this.saveState();
                this.render();
                return true;
            }
        } else {
            // Verificar se é usuário
            const user = this.state.users.find(u => u.email === email && u.password === password);
            if (user) {
                this.state.user = { ...user, type: 'user' };
                this.state.isLoggedIn = true;
                this.state.currentView = 'dashboard';
                this.saveState();
                this.render();
                return true;
            }
        }
        return false;
    }

    register(userData) {
        // Verificar se email já existe
        const emailExists = this.state.users.some(u => u.email === userData.email);
        if (emailExists) {
            return { success: false, message: 'Email já cadastrado' };
        }

        // Criar novo usuário
        const newUser = {
            id: 'user_' + Date.now(),
            ...userData,
            profileImage: null,
            createdAt: new Date().toISOString()
        };

        this.state.users.push(newUser);
        this.saveState();
        return { success: true, message: 'Usuário criado com sucesso' };
    }

    logout() {
        this.state.isLoggedIn = false;
        this.state.user = null;
        this.state.currentView = 'dashboard';
        this.render();
    }

    // Busca de mentores
    searchMentors(query, statusFilter = 'all') {
        let filteredMentors = this.state.mentors;

        // Filtrar por status
        if (statusFilter === 'online') {
            filteredMentors = filteredMentors.filter(m => m.isOnline === true);
        } else if (statusFilter === 'offline') {
            filteredMentors = filteredMentors.filter(m => m.isOnline === false);
        }

        // Filtrar por busca
        if (query) {
            filteredMentors = filteredMentors.filter(m => 
                m.fullName.toLowerCase().includes(query.toLowerCase()) ||
                m.expertise.toLowerCase().includes(query.toLowerCase())
            );
        }

        return filteredMentors;
    }

    // Sistema de chat
    sendMessage(mentorId, message) {
        const newMessage = {
            id: Date.now(),
            mentorId,
            userId: this.state.user.id,
            message,
            timestamp: new Date().toISOString(),
            sender: 'user'
        };

        this.state.chatMessages.push(newMessage);
        this.saveState();

        // Simular resposta do mentor após 2 segundos
        setTimeout(() => {
            const mentor = this.state.mentors.find(m => m.id === mentorId);
            const responses = [
                'Obrigado pela sua mensagem! Como posso ajudá-lo hoje?',
                'Interessante pergunta! Vamos conversar sobre isso.',
                'Fico feliz em poder ajudar. Qual é sua principal dúvida?',
                'Vamos trabalhar juntos para resolver isso!'
            ];
            
            const mentorResponse = {
                id: Date.now() + 1,
                mentorId,
                userId: this.state.user.id,
                message: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date().toISOString(),
                sender: 'mentor'
            };

            this.state.chatMessages.push(mentorResponse);
            this.saveState();
            
            if (this.state.currentView === 'chat' && this.state.selectedMentor?.id === mentorId) {
                this.renderChatMessages();
            }
        }, 2000);
    }

    getChatMessages(mentorId) {
        return this.state.chatMessages.filter(m => 
            m.mentorId === mentorId && m.userId === this.state.user.id
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    // Upload de imagem
    uploadProfileImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                this.state.user.profileImage = imageData;
                
                // Atualizar no array de usuários
                const userIndex = this.state.users.findIndex(u => u.id === this.state.user.id);
                if (userIndex !== -1) {
                    this.state.users[userIndex].profileImage = imageData;
                }
                
                this.saveState();
                resolve(imageData);
            };
            reader.readAsDataURL(file);
        });
    }

    // Renderização
    render() {
        const app = document.getElementById('app');
        
        if (!this.state.isLoggedIn) {
            this.renderLogin(app);
        } else {
            switch (this.state.currentView) {
                case 'dashboard':
                    this.renderDashboard(app);
                    break;
                case 'mentors':
                    this.renderMentorsScreen(app);
                    break;
                case 'chat':
                    this.renderChatScreen(app);
                    break;
                case 'profile':
                    this.renderProfileScreen(app);
                    break;
                default:
                    this.renderDashboard(app);
            }
        }
    }

    renderLogin(app) {
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div class="text-center mb-8">
                        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                            </svg>
                        </div>
                        <h1 class="text-3xl font-bold text-primary">Navio</h1>
                        <p class="text-gray-600 mt-2">Conectando talentos com mentores</p>
                    </div>

                    <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
                        <button id="student-mode-btn" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!this.state.isMentorMode ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}">
                            👨‍🎓 Estudante
                        </button>
                        <button id="mentor-mode-btn" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${this.state.isMentorMode ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}">
                            👨‍🏫 Mentor
                        </button>
                    </div>

                    <div class="flex mb-6 bg-gray-100 rounded-lg p-1">
                        <button id="login-mode-btn" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${this.state.isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}">
                            Entrar
                        </button>
                        <button id="register-mode-btn" class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!this.state.isLoginMode ? 'bg-white text-primary shadow-sm' : 'text-gray-600'}">
                            Registrar
                        </button>
                    </div>

                    <form id="auth-form" class="space-y-4">
                        ${!this.state.isLoginMode ? `
                            <div>
                                <input id="fullName" type="text" placeholder="Nome completo" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                        ` : ''}
                        
                        <div>
                            <input id="email" type="email" placeholder="Email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                        </div>
                        
                        <div>
                            <input id="password" type="password" placeholder="Senha" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                        </div>

                        ${!this.state.isLoginMode && !this.state.isMentorMode ? `
                            <div>
                                <input id="confirmPassword" type="password" placeholder="Confirmar senha" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <div>
                                <input id="experience" type="number" placeholder="Anos de experiência" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" min="0" required>
                            </div>
                        ` : ''}

                        <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                            ${this.state.isLoginMode ? 'Entrar' : 'Criar Conta'}
                        </button>
                    </form>

                    <div id="error-message" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg hidden"></div>
                    <div id="success-message" class="mt-4 p-3 bg-green-100 text-green-700 rounded-lg hidden"></div>
                </div>
            </div>
        `;

        this.setupLoginEvents();
    }

    renderDashboard(app) {
        const progress = Math.floor(Math.random() * 100); // Simular progresso
        
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                ${this.renderHeader()}
                
                <main class="container mx-auto px-6 py-8">
                    <div class="max-w-4xl mx-auto">
                        <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
                            <h2 class="text-4xl font-bold mb-4">Bem-vindo ao Navio, ${this.state.user.fullName}!</h2>
                            <p class="text-lg text-gray-600 mb-6">Conectando talentos com mentores experientes para acelerar o crescimento profissional.</p>
                            
                            <div class="flex justify-center space-x-4">
                                <button id="find-mentors-btn" class="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                                    Buscar Mentores
                                </button>
                                <button id="view-profile-btn" class="border border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                                    Meu Perfil
                                </button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div class="space-y-6">
                                <div class="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 class="text-xl font-semibold mb-4">🎯 Como Funciona</h3>
                                    <div class="space-y-3">
                                        <div class="flex items-start space-x-3">
                                            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                            <div>
                                                <div class="font-medium">Cadastro e Perfil</div>
                                                <div class="text-sm text-gray-600">Complete seu perfil e defina seus objetivos</div>
                                            </div>
                                        </div>
                                        <div class="flex items-start space-x-3">
                                            <div class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                            <div>
                                                <div class="font-medium">Match Inteligente</div>
                                                <div class="text-sm text-gray-600">Nossa IA encontra mentores compatíveis</div>
                                            </div>
                                        </div>
                                        <div class="flex items-start space-x-3">
                                            <div class="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                            <div>
                                                <div class="font-medium">Primeira Sessão</div>
                                                <div class="text-sm text-gray-600">Agende e realize sua primeira mentoria</div>
                                            </div>
                                        </div>
                                        <div class="flex items-start space-x-3">
                                            <div class="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                                            <div>
                                                <div class="font-medium">Acompanhamento</div>
                                                <div class="text-sm text-gray-600">Monitore seu progresso e evolução</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            <div class="space-y-6">


                                <div class="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 class="text-xl font-semibold mb-4">🌟 Mentor Recomendado</h3>
                                    <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                                        <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                            <span class="text-white text-xl">👩‍💼</span>
                                        </div>
                                        <div>
                                            <h4 class="font-semibold text-lg">Dra. Ana Silva</h4>
                                            <p class="text-gray-600">Comunicação Efetiva</p>
                                            <div class="text-yellow-500 text-sm">⭐ 4.9</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.setupDashboardEvents();
    }

    renderMentorsScreen(app) {
        const filteredMentors = this.searchMentors(this.state.searchQuery, this.state.statusFilter);
        
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                ${this.renderHeader()}
                
                <main class="container mx-auto px-6 py-8">
                    <div class="max-w-6xl mx-auto">
                        <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
                            <h2 class="text-3xl font-bold mb-6">Encontre seu Mentor</h2>
                            
                            <div class="flex flex-col md:flex-row gap-4 mb-6">
                                <div class="flex-1">
                                    <input 
                                        id="search-input" 
                                        type="text" 
                                        placeholder="Buscar por nome ou especialidade..." 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value="${this.state.searchQuery}"
                                    >
                                </div>
                                <div class="flex gap-2">
                                    <button id="filter-all" class="px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                                        Todos
                                    </button>
                                    <button id="filter-online" class="px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'online' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                                        Online
                                    </button>
                                    <button id="filter-offline" class="px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'offline' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}">
                                        Offline
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div id="mentors-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${filteredMentors.length > 0 ? filteredMentors.map(mentor => `
                                <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div class="flex items-center mb-4">
                                        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
                                            ${mentor.profileImage ? 
                                                `<img src="${mentor.profileImage}" alt="${mentor.fullName}" class="w-16 h-16 rounded-full object-cover">` :
                                                `<span class="text-white text-2xl">${mentor.avatar}</span>`
                                            }
                                        </div>
                                        <div class="flex-1">
                                            <h3 class="font-semibold text-lg">${mentor.fullName}</h3>
                                            <p class="text-gray-600 text-sm">${mentor.expertise}</p>
                                            <div class="flex items-center mt-1">
                                                <span class="text-yellow-500 text-sm">⭐ ${mentor.rating}</span>
                                                <span class="mx-2 text-gray-300">•</span>
                                                <span class="text-sm text-gray-600">${mentor.experience}</span>
                                            </div>
                                        </div>
                                        <div class="flex flex-col items-end">
                                            <div class="w-3 h-3 rounded-full ${mentor.isOnline ? 'bg-green-500' : 'bg-gray-400'} mb-1"></div>
                                            <span class="text-xs text-gray-500">${mentor.isOnline ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </div>
                                    
                                    <p class="text-gray-700 text-sm mb-4">${mentor.description}</p>
                                    
                                    <div class="flex gap-2">
                                        <button 
                                            class="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                                            onclick="navioApp.startChat('${mentor.id}')"
                                        >
                                            Iniciar Chat
                                        </button>
                                        <button class="px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                                            Ver Perfil
                                        </button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="col-span-full text-center py-12">
                                    <div class="text-6xl mb-4">🔍</div>
                                    <h3 class="text-xl font-semibold text-gray-700 mb-2">Nenhum mentor encontrado</h3>
                                    <p class="text-gray-500">Tente ajustar seus filtros de busca</p>
                                </div>
                            `}
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.setupMentorsEvents();
    }

    renderChatScreen(app) {
        if (!this.state.selectedMentor) {
            this.state.currentView = 'mentors';
            this.render();
            return;
        }

        const messages = this.getChatMessages(this.state.selectedMentor.id);
        
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                ${this.renderHeader()}
                
                <main class="container mx-auto px-6 py-8">
                    <div class="max-w-4xl mx-auto">
                        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div class="bg-primary text-white p-6">
                                <div class="flex items-center">
                                    <button id="back-to-mentors" class="mr-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                    </button>
                                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                                        ${this.state.selectedMentor.profileImage ? 
                                            `<img src="${this.state.selectedMentor.profileImage}" alt="${this.state.selectedMentor.fullName}" class="w-12 h-12 rounded-full object-cover">` :
                                            `<span class="text-white text-xl">${this.state.selectedMentor.avatar}</span>`
                                        }
                                    </div>
                                    <div>
                                        <h2 class="text-xl font-semibold">${this.state.selectedMentor.fullName}</h2>
                                        <p class="text-white text-opacity-80">${this.state.selectedMentor.expertise}</p>
                                        <div class="flex items-center mt-1">
                                            <div class="w-2 h-2 rounded-full ${this.state.selectedMentor.isOnline ? 'bg-green-400' : 'bg-gray-400'} mr-2"></div>
                                            <span class="text-sm text-white text-opacity-80">${this.state.selectedMentor.isOnline ? 'Online' : 'Offline'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="chat-messages" class="h-96 overflow-y-auto p-6 space-y-4">
                                ${messages.length > 0 ? messages.map(msg => `
                                    <div class="flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
                                        <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}">
                                            <p class="text-sm">${msg.message}</p>
                                            <p class="text-xs mt-1 ${msg.sender === 'user' ? 'text-white text-opacity-70' : 'text-gray-500'}">
                                                ${new Date(msg.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                `).join('') : `
                                    <div class="text-center text-gray-500 py-8">
                                        <p>Inicie uma conversa com ${this.state.selectedMentor.fullName}!</p>
                                    </div>
                                `}
                            </div>

                            <div class="border-t p-4">
                                <form id="chat-form" class="flex gap-2">
                                    <input 
                                        id="message-input" 
                                        type="text" 
                                        placeholder="Digite sua mensagem..." 
                                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    >
                                    <button 
                                        type="submit" 
                                        class="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        Enviar
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.setupChatEvents();
        this.scrollChatToBottom();
    }

    renderProfileScreen(app) {
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
                ${this.renderHeader()}
                
                <main class="container mx-auto px-6 py-8">
                    <div class="max-w-2xl mx-auto">
                        <div class="bg-white rounded-2xl shadow-lg p-8">
                            <h2 class="text-3xl font-bold mb-6">Meu Perfil</h2>
                            
                            <div class="flex items-center mb-8">
                                <div class="relative">
                                    <div class="w-24 h-24 bg-primary rounded-full flex items-center justify-center mr-6">
                                        ${this.state.user.profileImage ? 
                                            `<img src="${this.state.user.profileImage}" alt="${this.state.user.fullName}" class="w-24 h-24 rounded-full object-cover">` :
                                            `<span class="text-white text-3xl">👤</span>`
                                        }
                                    </div>
                                    <label for="profile-image-input" class="absolute bottom-0 right-6 bg-white border-2 border-gray-300 rounded-full p-2 cursor-pointer hover:bg-gray-50 transition-colors">
                                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                    </label>
                                    <input id="profile-image-input" type="file" accept="image/*" class="hidden">
                                </div>
                                <div>
                                    <h3 class="text-2xl font-semibold">${this.state.user.fullName}</h3>
                                    <p class="text-gray-600">${this.state.user.email}</p>
                                    <p class="text-sm text-gray-500 mt-1">${this.state.user.experience || 0} anos de experiência</p>
                                </div>
                            </div>

                            <form id="profile-form" class="space-y-6">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                                    <input 
                                        id="profile-name" 
                                        type="text" 
                                        value="${this.state.user.fullName}" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input 
                                        id="profile-email" 
                                        type="email" 
                                        value="${this.state.user.email}" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Anos de Experiência</label>
                                    <input 
                                        id="profile-experience" 
                                        type="number" 
                                        value="${this.state.user.experience || 0}" 
                                        min="0"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                </div>

                                <div class="flex gap-4">
                                    <button 
                                        type="submit" 
                                        class="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                                    >
                                        Salvar Alterações
                                    </button>
                                    <button 
                                        type="button" 
                                        id="cancel-profile-btn"
                                        class="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        `;

        this.setupProfileEvents();
    }

    renderHeader() {
        return `
            <header class="bg-white shadow-sm border-b border-gray-200">
                <div class="container mx-auto px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                                </svg>
                            </div>
                            <h1 class="text-2xl font-bold text-primary">Navio</h1>
                        </div>
                        
                        <nav class="hidden md:flex items-center space-x-6">
                            <button id="nav-dashboard" class="text-gray-600 hover:text-primary transition-colors ${this.state.currentView === 'dashboard' ? 'text-primary font-medium' : ''}">
                                Dashboard
                            </button>
                            <button id="nav-mentors" class="text-gray-600 hover:text-primary transition-colors ${this.state.currentView === 'mentors' ? 'text-primary font-medium' : ''}">
                                Mentores
                            </button>
                            <button id="nav-profile" class="text-gray-600 hover:text-primary transition-colors ${this.state.currentView === 'profile' ? 'text-primary font-medium' : ''}">
                                Perfil
                            </button>
                        </nav>

                        <div class="flex items-center space-x-4">
                            <span class="text-gray-700 hidden sm:block">Olá, ${this.state.user.fullName.split(' ')[0]}!</span>
                            <button id="logout-btn" class="text-gray-600 hover:text-red-600 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // Event Listeners
    setupLoginEvents() {
        const studentModeBtn = document.getElementById('student-mode-btn');
        const mentorModeBtn = document.getElementById('mentor-mode-btn');
        const loginModeBtn = document.getElementById('login-mode-btn');
        const registerModeBtn = document.getElementById('register-mode-btn');
        const authForm = document.getElementById('auth-form');

        studentModeBtn?.addEventListener('click', () => {
            this.state.isMentorMode = false;
            this.render();
        });

        mentorModeBtn?.addEventListener('click', () => {
            this.state.isMentorMode = true;
            this.render();
        });

        loginModeBtn?.addEventListener('click', () => {
            this.state.isLoginMode = true;
            this.render();
        });

        registerModeBtn?.addEventListener('click', () => {
            this.state.isLoginMode = false;
            this.render();
        });

        authForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (this.state.isLoginMode) {
                if (this.login(email, password)) {
                    this.showMessage('Login realizado com sucesso!', 'success');
                } else {
                    this.showMessage('Email ou senha incorretos', 'error');
                }
            } else {
                const fullName = document.getElementById('fullName').value;
                const confirmPassword = document.getElementById('confirmPassword')?.value;
                const experience = document.getElementById('experience')?.value || 0;
                
                if (password !== confirmPassword) {
                    this.showMessage('As senhas não coincidem', 'error');
                    return;
                }
                
                const result = this.register({
                    fullName,
                    email,
                    password,
                    experience: parseInt(experience)
                });
                
                if (result.success) {
                    this.showMessage(result.message, 'success');
                    this.state.isLoginMode = true;
                    this.render();
                } else {
                    this.showMessage(result.message, 'error');
                }
            }
        });
    }

    setupDashboardEvents() {
        const findMentorsBtn = document.getElementById('find-mentors-btn');
        const viewProfileBtn = document.getElementById('view-profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const navDashboard = document.getElementById('nav-dashboard');
        const navMentors = document.getElementById('nav-mentors');
        const navProfile = document.getElementById('nav-profile');

        findMentorsBtn?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        viewProfileBtn?.addEventListener('click', () => {
            this.state.currentView = 'profile';
            this.render();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        navDashboard?.addEventListener('click', () => {
            this.state.currentView = 'dashboard';
            this.render();
        });

        navMentors?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        navProfile?.addEventListener('click', () => {
            this.state.currentView = 'profile';
            this.render();
        });
    }

    setupMentorsEvents() {
        const searchInput = document.getElementById('search-input');
        const filterAll = document.getElementById('filter-all');
        const filterOnline = document.getElementById('filter-online');
        const filterOffline = document.getElementById('filter-offline');
        const logoutBtn = document.getElementById('logout-btn');
        const navDashboard = document.getElementById('nav-dashboard');
        const navMentors = document.getElementById('nav-mentors');
        const navProfile = document.getElementById('nav-profile');

        searchInput?.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.renderMentorsGrid();
        });

        filterAll?.addEventListener('click', () => {
            this.state.statusFilter = 'all';
            this.renderMentorsGrid();
        });

        filterOnline?.addEventListener('click', () => {
            this.state.statusFilter = 'online';
            this.renderMentorsGrid();
        });

        filterOffline?.addEventListener('click', () => {
            this.state.statusFilter = 'offline';
            this.renderMentorsGrid();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        navDashboard?.addEventListener('click', () => {
            this.state.currentView = 'dashboard';
            this.render();
        });

        navMentors?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        navProfile?.addEventListener('click', () => {
            this.state.currentView = 'profile';
            this.render();
        });
    }

    setupChatEvents() {
        const chatForm = document.getElementById('chat-form');
        const backToMentors = document.getElementById('back-to-mentors');
        const logoutBtn = document.getElementById('logout-btn');
        const navDashboard = document.getElementById('nav-dashboard');
        const navMentors = document.getElementById('nav-mentors');
        const navProfile = document.getElementById('nav-profile');

        chatForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageInput = document.getElementById('message-input');
            const message = messageInput.value.trim();
            
            if (message) {
                this.sendMessage(this.state.selectedMentor.id, message);
                messageInput.value = '';
                this.renderChatMessages();
            }
        });

        backToMentors?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        navDashboard?.addEventListener('click', () => {
            this.state.currentView = 'dashboard';
            this.render();
        });

        navMentors?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        navProfile?.addEventListener('click', () => {
            this.state.currentView = 'profile';
            this.render();
        });
    }

    setupProfileEvents() {
        const profileForm = document.getElementById('profile-form');
        const profileImageInput = document.getElementById('profile-image-input');
        const cancelProfileBtn = document.getElementById('cancel-profile-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const navDashboard = document.getElementById('nav-dashboard');
        const navMentors = document.getElementById('nav-mentors');
        const navProfile = document.getElementById('nav-profile');

        profileForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('profile-name').value;
            const email = document.getElementById('profile-email').value;
            const experience = document.getElementById('profile-experience').value;
            
            // Atualizar dados do usuário
            this.state.user.fullName = name;
            this.state.user.email = email;
            this.state.user.experience = parseInt(experience);
            
            // Atualizar no array de usuários
            const userIndex = this.state.users.findIndex(u => u.id === this.state.user.id);
            if (userIndex !== -1) {
                this.state.users[userIndex] = { ...this.state.user };
            }
            
            this.saveState();
            this.showMessage('Perfil atualizado com sucesso!', 'success');
        });

        profileImageInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.uploadProfileImage(file);
                    this.render();
                    this.showMessage('Foto de perfil atualizada!', 'success');
                } catch (error) {
                    this.showMessage('Erro ao fazer upload da imagem', 'error');
                }
            }
        });

        cancelProfileBtn?.addEventListener('click', () => {
            this.state.currentView = 'dashboard';
            this.render();
        });

        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });

        navDashboard?.addEventListener('click', () => {
            this.state.currentView = 'dashboard';
            this.render();
        });

        navMentors?.addEventListener('click', () => {
            this.state.currentView = 'mentors';
            this.render();
        });

        navProfile?.addEventListener('click', () => {
            this.state.currentView = 'profile';
            this.render();
        });
    }

    // Métodos auxiliares
    renderMentorsGrid() {
        const filteredMentors = this.searchMentors(this.state.searchQuery, this.state.statusFilter);
        const mentorsGrid = document.getElementById('mentors-grid');
        
        if (mentorsGrid) {
            mentorsGrid.innerHTML = filteredMentors.length > 0 ? filteredMentors.map(mentor => `
                <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="flex items-center mb-4">
                        <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
                            ${mentor.profileImage ? 
                                `<img src="${mentor.profileImage}" alt="${mentor.fullName}" class="w-16 h-16 rounded-full object-cover">` :
                                `<span class="text-white text-2xl">${mentor.avatar}</span>`
                            }
                        </div>
                        <div class="flex-1">
                            <h3 class="font-semibold text-lg">${mentor.fullName}</h3>
                            <p class="text-gray-600 text-sm">${mentor.expertise}</p>
                            <div class="flex items-center mt-1">
                                <span class="text-yellow-500 text-sm">⭐ ${mentor.rating}</span>
                                <span class="mx-2 text-gray-300">•</span>
                                <span class="text-sm text-gray-600">${mentor.experience}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <div class="w-3 h-3 rounded-full ${mentor.isOnline ? 'bg-green-500' : 'bg-gray-400'} mb-1"></div>
                            <span class="text-xs text-gray-500">${mentor.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
                    
                    <p class="text-gray-700 text-sm mb-4">${mentor.description}</p>
                    
                    <div class="flex gap-2">
                        <button 
                            class="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                            onclick="navioApp.startChat('${mentor.id}')"
                        >
                            Iniciar Chat
                        </button>
                        <button class="px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                            Ver Perfil
                        </button>
                    </div>
                </div>
            `).join('') : `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">Nenhum mentor encontrado</h3>
                    <p class="text-gray-500">Tente ajustar seus filtros de busca</p>
                </div>
            `;
            
            // Atualizar botões de filtro
            document.getElementById('filter-all').className = `px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
            document.getElementById('filter-online').className = `px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'online' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
            document.getElementById('filter-offline').className = `px-4 py-3 rounded-lg font-medium transition-colors ${this.state.statusFilter === 'offline' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
        }
    }

    renderChatMessages() {
        const messages = this.getChatMessages(this.state.selectedMentor.id);
        const chatMessages = document.getElementById('chat-messages');
        
        if (chatMessages) {
            chatMessages.innerHTML = messages.length > 0 ? messages.map(msg => `
                <div class="flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}">
                        <p class="text-sm">${msg.message}</p>
                        <p class="text-xs mt-1 ${msg.sender === 'user' ? 'text-white text-opacity-70' : 'text-gray-500'}">
                            ${new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            `).join('') : `
                <div class="text-center text-gray-500 py-8">
                    <p>Inicie uma conversa com ${this.state.selectedMentor.fullName}!</p>
                </div>
            `;
            
            this.scrollChatToBottom();
        }
    }

    scrollChatToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    startChat(mentorId) {
        const mentor = this.state.mentors.find(m => m.id === mentorId);
        if (mentor) {
            this.state.selectedMentor = mentor;
            this.state.currentView = 'chat';
            this.render();
        }
    }

    showMessage(message, type) {
        const errorDiv = document.getElementById('error-message');
        const successDiv = document.getElementById('success-message');
        
        if (type === 'error' && errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            setTimeout(() => errorDiv.classList.add('hidden'), 5000);
        } else if (type === 'success' && successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            setTimeout(() => successDiv.classList.add('hidden'), 5000);
        }
    }
}

// Inicializar a aplicação
let navioApp;
document.addEventListener('DOMContentLoaded', () => {
    navioApp = new NavioApp();
});

