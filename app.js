// GEX Dashboard - Aplicação Principal
console.log('GEX App: Carregando classe GEXApp...');

class GEXApp {
  constructor() {
    console.log('GEX App: Inicializando construtor...');
    this.currentUser = null;
    this.currentPage = 'home';
    this.dbManager = window.dbManager;
    this.charts = {};
    this.currentTimeframe = 'daily'; // Período padrão
    this.init();
  }

  async init() {
    try {
      console.log('🚀 GEX App: Iniciando aplicação...');
      
      // Inicializar banco de dados
      console.log('🗄️ GEX App: Inicializando banco de dados...');
      await this.dbManager.init();
      await this.dbManager.migrateFromLocalStorage();
      
      // Sempre recriar dados de demonstração
      console.log('🔄 GEX App: Criando dados de demonstração...');
      await this.dbManager.initializeDefaultData();
      console.log('✅ GEX App: Dados de demonstração criados');
      
      // Configurar event listeners
      console.log('🔗 GEX App: Configurando event listeners...');
      this.setupEventListeners();
      this.setupProductModalEventListeners();
      this.setupDeleteModalEventListeners();
      console.log('✅ GEX App: Event listeners configurados');
      
      // Configurar redimensionamento de gráficos
      this.setupChartResize();
      
      // Verificar se há usuário logado
      console.log('👤 GEX App: Verificando usuário logado...');
      await this.checkLoggedInUser();
      
      // Inicializar página atual
      console.log('📄 GEX App: Mostrando página inicial...');
      this.showPage(this.currentPage);
      
      console.log('🎉 GEX App: Aplicação inicializada com sucesso');
    } catch (error) {
      console.error('❌ GEX App: Erro ao inicializar aplicação:', error);
      this.showNotification('Erro ao inicializar aplicação', 'error');
    }
  }

  setupChartResize() {
    // Redimensionar gráficos quando a janela for redimensionada
    window.addEventListener('resize', () => {
      Object.values(this.charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    });
  }

  setupEventListeners() {
    console.log('GEX App: Configurando event listeners...');
    
    // Navegação do menu horizontal
    const menuLinks = document.querySelectorAll('.header-menu-link');
    console.log(`GEX App: Encontrados ${menuLinks.length} links de menu horizontal`);
    
    menuLinks.forEach((link, index) => {
      // Pular o botão de login que será tratado separadamente
      if (link.id === 'headerLoginBtn') {
        console.log(`GEX App: Pulando botão de login - será tratado separadamente`);
        return;
      }
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.closest('.header-menu-item').dataset.page;
        console.log(`GEX App: Clique no menu horizontal - página: ${page}`);
        
        
        this.showPage(page);
        
        // Atualizar estado ativo
        menuLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
      
      console.log(`GEX App: Event listener adicionado ao link horizontal ${index + 1}`);
    });

    // Botão de login na página inicial
    const loginBtn = document.getElementById('loginBtn');
    console.log(`GEX App: Botão de login encontrado: ${!!loginBtn}`);
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        console.log('GEX App: Clique no botão de login da página inicial');
        
        // Verificar se o usuário já está logado
        if (this.currentUser) {
          console.log('✅ GEX App: Usuário já logado, indo direto para o dashboard');
          this.showPage('dashboard');
          this.loadDashboardData();
        } else {
          console.log('ℹ️ GEX App: Usuário não logado, mostrando modal de login');
          this.showModal('loginModal');
        }
      });
      console.log('GEX App: Event listener do botão de login adicionado');
    }

    // Botão de login no header
    const headerLoginBtn = document.getElementById('headerLoginBtn');
    console.log(`GEX App: Botão de login do header encontrado: ${!!headerLoginBtn}`);
    if (headerLoginBtn) {
      headerLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('GEX App: Clique no botão de login do header');
        this.showModal('loginModal');
      });
      console.log('GEX App: Event listener do botão de login do header adicionado');
    }

    // Botão do manual
    const manualBtn = document.getElementById('manualBtn');
    console.log(`GEX App: Botão do manual encontrado: ${!!manualBtn}`);
    if (manualBtn) {
      manualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('GEX App: Clique no botão do manual');
        this.openManual();
      });
      console.log('GEX App: Event listener do botão do manual adicionado');
    }


    // Botões de controle da sidebar removidos - menu agora é horizontal

    // Botões de período (timeframe)
    document.querySelectorAll('.tf-btn, .demo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const range = e.target.dataset.range;
        this.setTimeframe(range);
      });
    });

    // Botões de ação
    this.setupActionButtons();
    
    // Modais
    this.setupModals();
    
    // Formulários
    this.setupForms();
  }

  setupActionButtons() {
    // Botão adicionar produto
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => this.showProductModal());
    }

    // Botão adicionar venda
    const addSaleBtn = document.getElementById('addSaleBtn');
    if (addSaleBtn) {
      addSaleBtn.addEventListener('click', () => this.showSaleModal());
    }

    // Botão adicionar custo personalizado
    const addCustomCostBtn = document.getElementById('addCustomCostBtn');
    if (addCustomCostBtn) {
      addCustomCostBtn.addEventListener('click', () => this.showCustomCostModal());
    }

    // Botão adicionar imposto
    const addTaxBtn = document.getElementById('addTaxBtn');
    if (addTaxBtn) {
      addTaxBtn.addEventListener('click', () => this.showTaxModal());
    }

    // Botões de custos

    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Cards de funcionalidades na página inicial
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const feature = card.dataset.feature;
        if (feature) {
          this.showPage(feature);
        }
      });
    });
  }

  setupModals() {
    // Modal de login
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const cancelLogin = document.getElementById('cancelLogin');
    const cancelRegister = document.getElementById('cancelRegister');
    
    if (closeLoginModal) {
      closeLoginModal.addEventListener('click', () => this.hideModal('loginModal'));
    }
    if (cancelLogin) {
      cancelLogin.addEventListener('click', () => this.hideModal('loginModal'));
    }
    if (cancelRegister) {
      cancelRegister.addEventListener('click', () => this.hideModal('loginModal'));
    }

    // Modal de produto
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProduct = document.getElementById('cancelProduct');
    
    if (closeProductModal) {
      closeProductModal.addEventListener('click', () => this.hideModal('productModal'));
    }
    if (cancelProduct) {
      cancelProduct.addEventListener('click', () => this.hideModal('productModal'));
    }

    // Modal de custo personalizado
    const customCostModal = document.getElementById('customCostModal');
    const closeCustomCostModal = document.getElementById('closeCustomCostModal');
    const cancelCustomCost = document.getElementById('cancelCustomCost');
    
    if (closeCustomCostModal) {
      closeCustomCostModal.addEventListener('click', () => this.hideModal('customCostModal'));
    }
    if (cancelCustomCost) {
      cancelCustomCost.addEventListener('click', () => this.hideModal('customCostModal'));
    }

    // Modal de imposto
    const taxModal = document.getElementById('taxModal');
    const closeTaxModal = document.getElementById('closeTaxModal');
    const cancelTax = document.getElementById('cancelTax');
    
    if (closeTaxModal) {
      closeTaxModal.addEventListener('click', () => this.hideModal('taxModal'));
    }
    if (cancelTax) {
      cancelTax.addEventListener('click', () => this.hideModal('taxModal'));
    }

    // Modal de venda
    const saleModal = document.getElementById('saleModal');
    const closeSaleModal = document.getElementById('closeSaleModal');
    const cancelSale = document.getElementById('cancelSale');
    
    if (closeSaleModal) {
      closeSaleModal.addEventListener('click', () => this.hideModal('saleModal'));
    }
    if (cancelSale) {
      cancelSale.addEventListener('click', () => this.hideModal('saleModal'));
    }


    // Switch entre login e cadastro (modal e página)
    const loginSwitch = document.getElementById('loginSwitch');
    const registerSwitch = document.getElementById('registerSwitch');
    
    if (loginSwitch) {
      loginSwitch.addEventListener('click', () => this.switchAuthForm('login'));
    }
    if (registerSwitch) {
      registerSwitch.addEventListener('click', () => this.switchAuthForm('register'));
    }

    // Botões da página de login
    const backToHome = document.getElementById('backToHome');
    const backToHome2 = document.getElementById('backToHome2');
    
    if (backToHome) {
      backToHome.addEventListener('click', () => this.showPage('home'));
    }
    if (backToHome2) {
      backToHome2.addEventListener('click', () => this.showPage('home'));
    }

    // Fechar modais clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }

  setupForms() {
    // Formulários de login e cadastro
    this.setupLoginForms();

    // Formulário de produto
    const productForm = document.getElementById('productForm');
    if (productForm) {
      productForm.addEventListener('submit', (e) => this.handleProductSubmit(e));
    }

    // Formulário de venda
    const saleForm = document.getElementById('saleForm');
    if (saleForm) {
      saleForm.addEventListener('submit', (e) => this.handleSaleSubmit(e));
    }

    // Formulário de custo personalizado
    const customCostForm = document.getElementById('customCostForm');
    if (customCostForm) {
      customCostForm.addEventListener('submit', (e) => this.handleCustomCostSubmit(e));
    }

    // Formulário de custo (legado)
    const costForm = document.getElementById('costForm');
    if (costForm) {
      costForm.addEventListener('submit', (e) => this.handleCostSubmit(e));
    }

    // Formulário de imposto
    const taxForm = document.getElementById('taxForm');
    if (taxForm) {
      taxForm.addEventListener('submit', (e) => this.handleTaxSubmit(e));
    }


    // Formulário de informações pessoais
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
      personalInfoForm.addEventListener('submit', (e) => this.handlePersonalInfoSubmit(e));
    }

    // Formulário de alteração de senha
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    // Botão adicionar produto na venda
    const addSaleProductBtn = document.getElementById('addSaleProductBtn');
    if (addSaleProductBtn) {
      addSaleProductBtn.addEventListener('click', () => this.addSaleProductRow());
    }

    // Upload de foto
    const photoInput = document.getElementById('photoInput');
    const accountUploadPhotoBtn = document.getElementById('accountUploadPhotoBtn');
    
    if (photoInput && accountUploadPhotoBtn) {
      accountUploadPhotoBtn.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
    }

    // Botão remover foto
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => this.removePhoto());
    }

    // Botão excluir conta
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
    }
  }

  // Navegação entre páginas
  showPage(pageName) {
    console.log(`GEX App: Tentando mostrar página: ${pageName}`);
    
    
    // Esconder todas as páginas
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
      console.log(`GEX App: Removendo classe active de: ${page.id}`);
    });

    // Mostrar página selecionada
    const targetPage = document.getElementById(`${pageName}-page`);
    console.log(`GEX App: Página encontrada: ${!!targetPage} (${pageName}-page)`);
    
    if (targetPage) {
      targetPage.classList.add('active');
      console.log(`GEX App: Classe active adicionada à página: ${pageName}`);
      this.currentPage = pageName;
      
      
      // Atualizar menu ativo
      this.updateActiveMenu(pageName);
      
      // Carregar dados específicos da página
      this.loadPageData(pageName);
      
      // Verificar se a página está realmente visível
      setTimeout(() => {
        const isVisible = targetPage.classList.contains('active') && 
                         getComputedStyle(targetPage).display !== 'none';
        console.log(`GEX App: Página ${pageName} está visível: ${isVisible}`);
        console.log(`GEX App: Display da página: ${getComputedStyle(targetPage).display}`);
        console.log(`GEX App: Classes da página: ${targetPage.className}`);
        
        // Debug específico para página Sobre
        if (pageName === 'about') {
          console.log('GEX App: Debug detalhado página Sobre:');
          console.log('- Elemento:', targetPage);
          console.log('- ID:', targetPage.id);
          console.log('- Display:', getComputedStyle(targetPage).display);
          console.log('- Visibility:', getComputedStyle(targetPage).visibility);
          console.log('- Opacity:', getComputedStyle(targetPage).opacity);
          console.log('- Position:', getComputedStyle(targetPage).position);
          console.log('- Z-index:', getComputedStyle(targetPage).zIndex);
          console.log('- Height:', getComputedStyle(targetPage).height);
          console.log('- Width:', getComputedStyle(targetPage).width);
          console.log('- Content:', targetPage.innerHTML.substring(0, 200) + '...');
        }
        
        if (!isVisible) {
          console.error(`GEX App: Página ${pageName} não está visível!`);
        }
      }, 100);
    } else {
      console.error(`Página ${pageName} não encontrada`);
    }
  }

  loadPageData(pageName) {
    console.log(`GEX App: Carregando dados da página: ${pageName}`);
    switch (pageName) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'products':
        this.loadProductsData();
        break;
      case 'sales':
        this.loadSalesData();
        break;
      case 'costs':
        this.loadCostsData();
        break;
      case 'about':
        this.loadAboutData();
        break;
      case 'account':
        this.loadAccountData();
        break;
      default:
        console.log(`GEX App: Página ${pageName} não tem dados específicos para carregar`);
    }
  }

  setupLoginForms() {
    // Botões de switch (Login/Cadastro)
    const loginSwitch = document.getElementById('loginSwitch');
    const registerSwitch = document.getElementById('registerSwitch');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginSwitch && registerSwitch && loginForm && registerForm) {
      loginSwitch.addEventListener('click', () => {
        this.switchAuthForm('login');
      });

      registerSwitch.addEventListener('click', () => {
        this.switchAuthForm('register');
      });

      // Formulário de login
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));

      // Formulário de cadastro
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
  }

  // Sistema de login
  async checkLoggedInUser() {
    console.log('🔍 GEX App: Verificando usuário logado');
    
    try {
      // Verificar se há usuário salvo no localStorage
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Verificar se o usuário ainda existe no banco de dados
        const userExists = await this.dbManager.getUser(userData.id);
        if (userExists) {
          this.currentUser = userData;
          this.updateUIForLoggedInUser();
          console.log('✅ GEX App: Usuário carregado do localStorage:', this.currentUser.username);
          console.log('👤 GEX App: Usuário atual:', {
            id: this.currentUser.id,
            name: this.currentUser.name,
            username: this.currentUser.username
          });
        } else {
          console.log('⚠️ GEX App: Usuário não existe mais no banco, removendo do localStorage');
          localStorage.removeItem('currentUser');
          this.currentUser = null;
          this.updateUIForLoggedInUser();
        }
      } else {
        console.log('ℹ️ GEX App: Nenhum usuário logado');
        this.currentUser = null;
        this.updateUIForLoggedInUser();
      }
    } catch (error) {
      console.error('❌ GEX App: Erro ao verificar usuário logado:', error);
      this.currentUser = null;
      this.updateUIForLoggedInUser();
    }
  }

  updateUIForLoggedInUser() {
    console.log('🔄 Atualizando UI para usuário:', this.currentUser);
    
    if (this.currentUser) {
      console.log('✅ Usuário logado, mostrando elementos do usuário');
      // Mostrar elementos do usuário logado
      document.getElementById('userProfile').style.display = 'block';
      document.getElementById('logoutBtn').style.display = 'block';
      document.getElementById('accountMenuItem').style.display = 'block';
      document.getElementById('loginMenuItem').style.display = 'none';
      
      // Atualizar texto do botão de login para "Ir para Dashboard"
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Ir para Dashboard';
        loginBtn.title = 'Acessar Dashboard';
      }
      
      // Atualizar informações do perfil
      this.updateProfileInfo();
    } else {
      console.log('❌ Usuário não logado, mostrando elementos de login');
      // Mostrar elementos para usuário não logado
      document.getElementById('userProfile').style.display = 'none';
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('accountMenuItem').style.display = 'none';
      document.getElementById('loginMenuItem').style.display = 'block';
      
      // Atualizar texto do botão de login para "Acessar Dashboard"
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acessar Dashboard';
        loginBtn.title = 'Fazer Login';
      }
    }
  }

  updateProfileInfo() {
    if (this.currentUser) {
      // Atualizar foto do perfil
      const profileImage = document.getElementById('profileImage');
      const profilePlaceholder = document.getElementById('profilePlaceholder');
      
      if (this.currentUser.photo) {
        profileImage.src = this.currentUser.photo;
        profileImage.style.display = 'block';
        profilePlaceholder.style.display = 'none';
      } else {
        profileImage.style.display = 'none';
        profilePlaceholder.style.display = 'flex';
      }

      // Atualizar informações da conta
      const accountProfileImage = document.getElementById('accountProfileImage');
      const accountProfilePlaceholder = document.getElementById('accountProfilePlaceholder');
      const accountProfileName = document.getElementById('accountProfileName');
      const accountProfileEmail = document.getElementById('accountProfileEmail');
      
      if (accountProfileImage) {
        if (this.currentUser.photo) {
          accountProfileImage.src = this.currentUser.photo;
          accountProfileImage.style.display = 'block';
          accountProfilePlaceholder.style.display = 'none';
        } else {
          accountProfileImage.style.display = 'none';
          accountProfilePlaceholder.style.display = 'flex';
        }
      }
      
      if (accountProfileName) accountProfileName.textContent = this.currentUser.name;
      if (accountProfileEmail) accountProfileEmail.textContent = this.currentUser.email;
    }
  }


  switchAuthForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginSwitch = document.getElementById('loginSwitch');
    const registerSwitch = document.getElementById('registerSwitch');

    if (formType === 'login') {
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
      loginSwitch.classList.add('active');
      registerSwitch.classList.remove('active');
    } else {
      loginForm.classList.remove('active');
      registerForm.classList.add('active');
      loginSwitch.classList.remove('active');
      registerSwitch.classList.add('active');
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('🔐 Tentativa de login:', { username, password: '***' });

    // Validações básicas
    if (!username || !password) {
      this.showNotification('Por favor, preencha todos os campos', 'error');
      return;
    }

    if (username.trim().length < 3) {
      this.showNotification('Nome de usuário deve ter pelo menos 3 caracteres', 'error');
      return;
    }

    if (password.length < 3) {
      this.showNotification('Senha deve ter pelo menos 3 caracteres', 'error');
      return;
    }

    try {
      console.log('🔍 Buscando usuário no banco de dados...');
      const user = await this.dbManager.getUserByUsername(username);
      console.log('👤 Usuário encontrado:', user);

      if (!user) {
        console.log('❌ Usuário não encontrado');
        this.showNotification('Usuário não encontrado. Verifique o nome de usuário ou cadastre-se', 'error');
        return;
      }

      if (user.password !== password) {
        console.log('❌ Senha incorreta');
        this.showNotification('Senha incorreta. Tente novamente', 'error');
        return;
      }

      console.log('✅ Login bem-sucedido!');
      this.currentUser = user;
      
      // Salvar usuário no localStorage para persistência
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('💾 Usuário salvo no localStorage:', user.username);
      
      this.updateUIForLoggedInUser();
      this.showNotification('Login realizado com sucesso!', 'success');
      this.hideModal('loginModal');
      this.showPage('dashboard');
      
      // Carregar dados do usuário após login
      console.log('📊 Carregando dados do usuário após login...');
      this.loadDashboardData();
      this.loadProductsData();
      this.loadSalesData();
      this.loadCostsData();

    } catch (error) {
      console.error('💥 Erro no login:', error);
      
      // Tratamento específico de erros
      if (error.name === 'InvalidStateError') {
        this.showNotification('Erro no banco de dados. Recarregue a página e tente novamente', 'error');
      } else if (error.name === 'TransactionInactiveError') {
        this.showNotification('Erro de conexão com o banco de dados. Tente novamente', 'error');
      } else if (error.name === 'DataError') {
        this.showNotification('Erro nos dados. Verifique se o banco de dados está funcionando', 'error');
      } else {
        this.showNotification('Erro inesperado ao fazer login. Tente novamente', 'error');
      }
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const username = formData.get('username');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validações básicas
    if (!name || !email || !username || !password || !confirmPassword) {
      this.showNotification('Por favor, preencha todos os campos', 'error');
      return;
    }

    if (name.trim().length < 2) {
      this.showNotification('Nome deve ter pelo menos 2 caracteres', 'error');
      return;
    }

    if (username.trim().length < 3) {
      this.showNotification('Nome de usuário deve ter pelo menos 3 caracteres', 'error');
      return;
    }

    if (password.length < 3) {
      this.showNotification('Senha deve ter pelo menos 3 caracteres', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showNotification('As senhas não coincidem', 'error');
      return;
    }

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showNotification('Por favor, insira um email válido', 'error');
      return;
    }

    try {
      console.log('📝 Tentativa de cadastro:', { name, email, username });
      
      // Verificar se usuário já existe
      console.log('🔍 Verificando se usuário já existe...');
      const existingUser = await this.dbManager.getUserByUsername(username);
      console.log('👤 Usuário existente:', existingUser);
      
      if (existingUser) {
        console.log('❌ Usuário já existe');
        this.showNotification('Nome de usuário já existe. Escolha outro nome de usuário', 'error');
        return;
      }

      // Verificar se email já existe
      const existingEmail = await this.dbManager.getUserByEmail(email);
      if (existingEmail) {
        console.log('❌ Email já existe');
        this.showNotification('Email já cadastrado. Use outro email ou faça login', 'error');
        return;
      }

      // Criar novo usuário
      const newUser = {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password
      };
      console.log('👤 Criando novo usuário:', newUser);

      const createdUser = await this.dbManager.addUser(newUser);
      console.log('✅ Usuário criado com sucesso:', createdUser);
      
      // Buscar o usuário completo do banco para obter o ID gerado
      const fullUser = await this.dbManager.getUserByUsername(username);
      console.log('👤 Usuário completo obtido do banco:', fullUser);
      
      this.showNotification('Cadastro realizado com sucesso! Faça login para continuar', 'success');
      this.switchAuthForm('login');
      this.hideModal('loginModal');
    } catch (error) {
      console.error('💥 Erro no cadastro:', error);
      
      // Tratamento específico de erros
      if (error.name === 'InvalidStateError') {
        this.showNotification('Erro no banco de dados. Recarregue a página e tente novamente', 'error');
      } else if (error.name === 'TransactionInactiveError') {
        this.showNotification('Erro de conexão com o banco de dados. Tente novamente', 'error');
      } else if (error.name === 'DataError') {
        this.showNotification('Erro nos dados. Verifique se o banco de dados está funcionando', 'error');
      } else if (error.name === 'ConstraintError') {
        this.showNotification('Erro: Usuário ou email já existem. Tente fazer login', 'error');
      } else {
        this.showNotification('Erro inesperado ao fazer cadastro. Tente novamente', 'error');
      }
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    this.updateUIForLoggedInUser();
    this.showPage('home');
    this.showNotification('Logout realizado com sucesso', 'success');
  }

  // Atualizar menu ativo no header
  updateActiveMenu(pageName) {
    const menuLinks = document.querySelectorAll('.header-menu-link');
    menuLinks.forEach(link => {
      const menuItem = link.closest('.header-menu-item');
      if (menuItem && menuItem.dataset.page === pageName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Sistema de modais
  showModal(modalId) {
    console.log('GEX App: showModal chamado com ID:', modalId);
    const modal = document.getElementById(modalId);
    console.log('GEX App: Modal encontrado:', !!modal);
    if (modal) {
      modal.classList.add('active');
      console.log('GEX App: Classe active adicionada ao modal:', modalId);
      // Verificar se o modal está visível
      setTimeout(() => {
        const isVisible = modal.classList.contains('active');
        console.log('GEX App: Modal visível:', isVisible);
        console.log('GEX App: Display do modal:', getComputedStyle(modal).display);
      }, 100);
    } else {
      console.error('GEX App: Modal não encontrado:', modalId);
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      // Não alterar o overflow do body
      console.log('Modal escondido:', modalId);
      
      // Limpar formulários
      const forms = modal.querySelectorAll('form');
      forms.forEach(form => form.reset());
    } else {
      console.error('Modal não encontrado:', modalId);
    }
  }

  // Sistema de notificações
  showNotification(message, type = 'info') {
    console.log('🔔 Mostrando notificação:', { message, type });
    
    const container = document.getElementById('notificationContainer');
    if (!container) {
      console.error('❌ Container de notificações não encontrado!');
      // Fallback: usar alert
      alert(`${type.toUpperCase()}: ${message}`);
      return;
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(notification);

    // Forçar a animação após um pequeno delay
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remover após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('hide');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);

    // Botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.add('hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    });
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Carregamento de dados das páginas
  async loadDashboardData() {
    if (!this.currentUser) {
      console.log('❌ loadDashboardData: Usuário não logado');
      return;
    }

    try {
      console.log('📊 GEX App: Carregando dados do dashboard...');
      console.log('👤 Usuário:', this.currentUser.username, '(ID:', this.currentUser.id + ')');
      
      const sales = await this.dbManager.getSalesByUser(this.currentUser.id);
      const products = await this.dbManager.getProductsByUser(this.currentUser.id);
      
      console.log('📈 Dados carregados:', {
        vendas: sales.length,
        produtos: products.length
      });
      
      if (sales.length > 0) {
        console.log('💰 Primeiras 3 vendas:', sales.slice(0, 3).map(s => ({
          produto: s.productName,
          valor: s.amount,
          data: s.date,
          hora: s.time
        })));
      }
      
      if (products.length > 0) {
        console.log('🛍️ Primeiros 3 produtos:', products.slice(0, 3).map(p => ({
          nome: p.name,
          preco: p.price,
          estoque: p.stock
        })));
      }
      
      // Atualizar componentes
      this.updateKPIs(sales);
      await this.updateCharts(sales, products);
      this.updateSalesTable(sales);
      this.updateDashboardSalesTable(sales);
      
      console.log('✅ GEX App: Dashboard atualizado com sucesso');
    } catch (error) {
      console.error('❌ GEX App: Erro ao carregar dados do dashboard:', error);
    }
  }

  async loadProductsData() {
    if (!this.currentUser) return;

    try {
      const products = await this.dbManager.getProductsByUser(this.currentUser.id);
      this.updateProductsTable(products);
      this.updateProductsSummary(products);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }

  async loadSalesData() {
    if (!this.currentUser) return;

    try {
      const sales = await this.dbManager.getSalesByUser(this.currentUser.id);
      this.updateSalesTable(sales);
      this.updateSalesSummary(sales);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    }
  }


  async loadCostsData() {
    if (!this.currentUser) return;

    try {
      console.log('💰 GEX App: Carregando dados de custos...');
      
      // Carregar dados de diferentes tipos de custos
      const products = await this.dbManager.getProductsByUser(this.currentUser.id);
      const costs = await this.dbManager.getCostsByUser(this.currentUser.id);
      const taxes = await this.dbManager.getTaxesByUser(this.currentUser.id);
      
      console.log('📊 Dados de custos carregados:', {
        produtos: products.length,
        custos: costs.length,
        impostos: taxes.length
      });
      
      // Atualizar resumo de custos
      this.updateCostsSummary(products, costs, taxes);
      
      // Atualizar tabelas
      this.updateProductCostsTable(products);
      this.updateTaxesTable(taxes);
      this.updateOperationalCostsTable(costs);
      
      // Configurar tabs
      this.setupCostsTabs();
      
      console.log('✅ GEX App: Dados de custos atualizados');
    } catch (error) {
      console.error('❌ GEX App: Erro ao carregar dados de custos:', error);
    }
  }


  async loadAccountData() {
    if (!this.currentUser) return;

    // Preencher formulário com dados do usuário
    const nameInput = document.getElementById('accountName');
    const usernameInput = document.getElementById('accountUsername');
    const emailInput = document.getElementById('accountEmail');

    if (nameInput) nameInput.value = this.currentUser.name || '';
    if (usernameInput) usernameInput.value = this.currentUser.username || '';
    if (emailInput) emailInput.value = this.currentUser.email || '';
  }

  // Função para carregar dados da página Sobre
  loadAboutData() {
    console.log('GEX App: Carregando dados da página Sobre');
    
    // Setup dos links do LinkedIn (se necessário)
    this.setupAboutPageLinks();
  }

  setupAboutPageLinks() {
    // Configurar links de LinkedIn dos desenvolvedores
    const linkedinButtons = document.querySelectorAll('.linkedin-btn');
    
    linkedinButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        // Obter o link do atributo href do botão
        const linkedinUrl = button.getAttribute('href');
        if (linkedinUrl && linkedinUrl !== '#') {
          window.open(linkedinUrl, '_blank');
        } else {
          alert('Link do LinkedIn não configurado!');
        }
      });
    });

    // Configurar interatividade das tecnologias
    this.setupTechInteractions();
    
    // Configurar interatividade do card do projeto
    this.setupProjectCardInteractions();
  }

  setupProjectCardInteractions() {
    // Configurar interatividade dos cards de funcionalidades
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      card.addEventListener('click', () => {
        const feature = card.dataset.feature;
        this.showFeatureDetails(feature);
      });

      // Efeito de hover com som
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px) scale(1.02)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });

    // Configurar botões de ação
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const isPrimary = button.classList.contains('primary');
        if (isPrimary) {
          this.showDemoModal();
        } else {
          this.showSourceCodeModal();
        }
      });
    });

    // Configurar tags de tecnologia
    const techTags = document.querySelectorAll('.tech-tag');
    techTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const techName = tag.textContent;
        this.showTechQuickInfo(techName);
      });
    });
  }

  showFeatureDetails(feature) {
    const featureInfo = {
      'dashboard': {
        title: 'Dashboard Inteligente',
        description: 'Sistema de painel de controle com KPIs em tempo real, gráficos interativos e métricas de performance empresarial.',
        benefits: ['Visualização em tempo real', 'Métricas personalizáveis', 'Interface intuitiva', 'Relatórios automáticos']
      },
      'products': {
        title: 'Gestão de Produtos',
        description: 'Controle completo do catálogo de produtos, estoque, preços e categorização.',
        benefits: ['Controle de estoque', 'Gestão de preços', 'Categorização', 'Histórico de vendas']
      },
      'sales': {
        title: 'Controle de Vendas',
        description: 'Sistema completo de faturamento, análise de performance e gestão de clientes.',
        benefits: ['Faturamento automático', 'Análise de vendas', 'Gestão de clientes', 'Relatórios de performance']
      },
      'costs': {
        title: 'Gestão de Custos',
        description: 'Análise detalhada de despesas, custos operacionais e cálculo de lucros.',
        benefits: ['Controle de despesas', 'Análise de custos', 'Cálculo de lucros', 'Relatórios financeiros']
      },
      'reports': {
        title: 'Relatórios Avançados',
        description: 'Sistema de relatórios personalizáveis com gráficos e análises detalhadas.',
        benefits: ['Relatórios personalizáveis', 'Gráficos interativos', 'Exportação de dados', 'Análises comparativas']
      },
      'responsive': {
        title: 'Design Responsivo',
        description: 'Interface adaptável que funciona perfeitamente em todos os dispositivos.',
        benefits: ['Mobile-first', 'Adaptação automática', 'Performance otimizada', 'Experiência consistente']
      }
    };

    const info = featureInfo[feature];
    if (!info) return;

    this.showFeatureModal(info);
  }

  showFeatureModal(info) {
    const modal = document.createElement('div');
    modal.className = 'feature-modal';
    modal.innerHTML = `
      <div class="feature-modal-content">
        <div class="feature-modal-header">
          <h3>${info.title}</h3>
          <button class="feature-modal-close">&times;</button>
        </div>
        <div class="feature-modal-body">
          <p>${info.description}</p>
          <div class="feature-benefits">
            <h4>Principais Benefícios:</h4>
            <ul>
              ${info.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;

    const content = modal.querySelector('.feature-modal-content');
    content.style.cssText = `
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      animation: slideInUp 0.3s ease;
    `;

    document.body.appendChild(modal);

    // Fechar modal
    const closeBtn = modal.querySelector('.feature-modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  showDemoModal() {
    alert('Demo do projeto em desenvolvimento! Em breve estará disponível.');
  }

  showSourceCodeModal() {
    alert('Código fonte será disponibilizado após a conclusão do TCC!');
  }

  showTechQuickInfo(techName) {
    const techInfo = {
      'HTML5': 'Linguagem de marcação para estruturação de conteúdo web.',
      'CSS3': 'Linguagem de estilização para design e layout responsivo.',
      'JavaScript': 'Linguagem de programação para interatividade e lógica.',
      'Node.js': 'Runtime JavaScript para desenvolvimento backend.',
      'SQLite': 'Banco de dados leve e eficiente para armazenamento.'
    };

    const description = techInfo[techName] || 'Tecnologia utilizada no projeto.';
    
    // Criar tooltip temporário
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      background: var(--card);
      color: var(--text);
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      animation: fadeIn 0.3s ease;
    `;
    tooltip.textContent = description;

    document.body.appendChild(tooltip);

    // Posicionar tooltip
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';

    // Remover após 3 segundos
    setTimeout(() => {
      tooltip.remove();
    }, 3000);
  }

  setupTechInteractions() {
    const techItems = document.querySelectorAll('.tech-list-item');
    
    techItems.forEach(item => {
      // Adicionar efeito de clique
      item.addEventListener('click', () => {
        const techName = item.querySelector('span').textContent;
        const techDescription = item.querySelector('.tech-description').textContent;
        
        // Criar modal ou tooltip com informações detalhadas
        this.showTechDetails(techName, techDescription, item.dataset.tech);
      });

      // Adicionar efeito de hover com som
      item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateX(8px) scale(1.02)';
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateX(0) scale(1)';
      });
    });
  }

  showTechDetails(techName, description, techType) {
    // Criar modal dinâmico
    const modal = document.createElement('div');
    modal.className = 'tech-modal';
    modal.innerHTML = `
      <div class="tech-modal-content">
        <div class="tech-modal-header">
          <h3>${techName}</h3>
          <button class="tech-modal-close">&times;</button>
        </div>
        <div class="tech-modal-body">
          <p>${description}</p>
          <div class="tech-modal-info">
            <strong>Tipo:</strong> ${this.getTechCategory(techType)}<br>
            <strong>Status:</strong> <span class="tech-status">Utilizada no projeto</span>
          </div>
        </div>
      </div>
    `;

    // Adicionar estilos do modal
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;

    const content = modal.querySelector('.tech-modal-content');
    content.style.cssText = `
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      animation: slideInUp 0.3s ease;
    `;

    document.body.appendChild(modal);

    // Fechar modal
    const closeBtn = modal.querySelector('.tech-modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Adicionar estilos CSS dinâmicos
    if (!document.getElementById('tech-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'tech-modal-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .tech-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--card-border);
          padding-bottom: 15px;
        }
        .tech-modal-header h3 {
          color: var(--text);
          margin: 0;
        }
        .tech-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          transition: color 0.3s ease;
        }
        .tech-modal-close:hover {
          color: var(--accent);
        }
        .tech-modal-body p {
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .tech-modal-info {
          background: rgba(255, 255, 255, 0.03);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tech-status {
          color: var(--success);
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }
  }

  getTechCategory(techType) {
    const categories = {
      'html5': 'Frontend',
      'css3': 'Frontend', 
      'javascript': 'Frontend',
      'chartjs': 'Frontend',
      'nodejs': 'Backend',
      'sqlite': 'Backend',
      'express': 'Backend',
      'git': 'Ferramentas',
      'vscode': 'Ferramentas',
      'figma': 'Ferramentas'
    };
    return categories[techType] || 'Tecnologia';
  }

  // Funções de custos
  updateCostsSummary(products, costs, taxes) {
    // Calcular custos de produtos
    const totalProductCosts = products.reduce((sum, product) => {
      const cost = product.cost || 0;
      const stock = product.stock || 0;
      return sum + (cost * stock);
    }, 0);

    // Calcular custos operacionais
    const totalOperationalCosts = costs.reduce((sum, cost) => sum + (cost.value || 0), 0);

    // Calcular impostos (assumindo que são percentuais aplicados sobre vendas)
    const totalTaxes = taxes.reduce((sum, tax) => sum + (tax.value || 0), 0);

    // Total geral
    const totalAllCosts = totalProductCosts + totalOperationalCosts + totalTaxes;

    // Atualizar elementos
    const productCostsEl = document.getElementById('totalProductCosts');
    const operationalCostsEl = document.getElementById('totalOperationalCosts');
    const taxesEl = document.getElementById('totalTaxes');
    const allCostsEl = document.getElementById('totalAllCosts');

    if (productCostsEl) productCostsEl.textContent = this.formatCurrency(totalProductCosts);
    if (operationalCostsEl) operationalCostsEl.textContent = this.formatCurrency(totalOperationalCosts);
    if (taxesEl) taxesEl.textContent = this.formatCurrency(totalTaxes);
    if (allCostsEl) allCostsEl.textContent = this.formatCurrency(totalAllCosts);
  }

  updateProductCostsTable(products) {
    const tbody = document.getElementById('productCostsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    products.forEach(product => {
      const cost = product.cost || 0;
      const stock = product.stock || 0;
      const totalCost = cost * stock;
      const price = product.price || 0;
      const margin = this.calculateMargin(price, cost);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${this.formatCurrency(cost)}</td>
        <td>${stock}</td>
        <td>${this.formatCurrency(totalCost)}</td>
        <td>${this.formatCurrency(price)}</td>
        <td>${margin.toFixed(1)}%</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="app.showEditProductModal('${product.id}')">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateTaxesTable(taxes) {
    const tbody = document.getElementById('taxesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (taxes.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    taxes.forEach(tax => {
      const taxDate = new Date(tax.date);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tax.description}</td>
        <td>${this.getTaxTypeLabel(tax.type)}</td>
        <td>${tax.value}%</td>
        <td>${taxDate.toLocaleDateString('pt-BR')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-danger" onclick="app.deleteTax('${tax.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateOperationalCostsTable(costs) {
    const tbody = document.getElementById('operationalCostsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (costs.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    costs.forEach(cost => {
      const costDate = new Date(cost.date);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${cost.description}</td>
        <td>${this.getCategoryLabel(cost.category)}</td>
        <td>${this.formatCurrency(cost.value)}</td>
        <td>${costDate.toLocaleDateString('pt-BR')}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-danger" onclick="app.deleteCost('${cost.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  setupCostsTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Remover classe active de todos os botões e conteúdos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adicionar classe active ao botão clicado e conteúdo correspondente
        button.classList.add('active');
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  getTaxTypeLabel(type) {
    const labels = {
      'icms': 'ICMS',
      'pis': 'PIS',
      'cofins': 'COFINS',
      'iss': 'ISS',
      'ipi': 'IPI',
      'irpj': 'IRPJ',
      'csll': 'CSLL',
      'simples': 'Simples Nacional',
      'outros': 'Outros'
    };
    return labels[type] || type;
  }

  getCategoryLabel(category) {
    const labels = {
      'operacional': 'Operacional',
      'marketing': 'Marketing',
      'administrativo': 'Administrativo',
      'manutencao': 'Manutenção',
      'aluguel': 'Aluguel',
      'energia': 'Energia',
      'agua': 'Água',
      'telefone': 'Telefone/Internet',
      'combustivel': 'Combustível',
      'outros': 'Outros'
    };
    return labels[category] || category;
  }

  // Atualização de KPIs
  updateKPIs(sales) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalOrders = sales.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Calcular custo total e lucro
    const totalCost = sales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    
    // Calcular margem média
    const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Atualizar elementos
    const revenueEl = document.getElementById('kpiRevenue');
    const ordersEl = document.getElementById('kpiOrders');
    const avgTicketEl = document.getElementById('kpiAvgTicket');
    const itemsEl = document.getElementById('kpiItems');
    const profitEl = document.getElementById('kpiProfit');
    const costEl = document.getElementById('kpiCost');
    const marginEl = document.getElementById('kpiMargin');

    if (revenueEl) revenueEl.textContent = this.formatCurrency(totalRevenue);
    if (ordersEl) ordersEl.textContent = totalOrders.toString();
    if (avgTicketEl) avgTicketEl.textContent = this.formatCurrency(avgTicket);
    if (itemsEl) itemsEl.textContent = totalItems.toString();
    if (profitEl) profitEl.textContent = this.formatCurrency(totalProfit);
    if (costEl) costEl.textContent = this.formatCurrency(totalCost);
    if (marginEl) marginEl.textContent = avgMargin.toFixed(1) + '%';
  }

  // Atualização de gráficos
  async updateCharts(sales, products) {
    this.updateSalesChart(sales);
    await this.updateTopProductsChart(products);
  }

  updateSalesChart(sales) {
    console.log('[DEBUG] updateSalesChart: Iniciando com', sales.length, 'vendas');
    const canvas = document.getElementById('salesOverview');
    if (!canvas) {
      console.log('[DEBUG] updateSalesChart: Canvas salesOverview não encontrado');
      return;
    }

    // Destruir gráfico existente
    if (this.charts.sales) {
      this.charts.sales.destroy();
    }

    let groupedData = {};
    let labels = [];
    let data = [];

    if (this.currentTimeframe === 'daily') {
      console.log('[DEBUG] updateSalesChart: Processando período diário');
      // Para período diário, agrupar por horário
      const salesByHour = {};
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const hour = saleDate.getHours();
        const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
        salesByHour[hourLabel] = (salesByHour[hourLabel] || 0) + sale.amount;
      });

      console.log('[DEBUG] updateSalesChart: Vendas por horário:', salesByHour);

      // Criar labels para todas as horas do dia (00:00 até 23:00)
      const allHours = [];
      for (let i = 0; i < 24; i++) {
        allHours.push(`${i.toString().padStart(2, '0')}:00`);
      }

      labels = allHours;
      data = allHours.map(hour => salesByHour[hour] || 0);
    } else {
      console.log('[DEBUG] updateSalesChart: Processando período', this.currentTimeframe);
      // Para outros períodos, agrupar por data
      sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString('pt-BR');
        groupedData[date] = (groupedData[date] || 0) + sale.amount;
      });

      labels = Object.keys(groupedData).sort();
      data = labels.map(label => groupedData[label]);
    }

    console.log('[DEBUG] updateSalesChart: Labels:', labels);
    console.log('[DEBUG] updateSalesChart: Data:', data);

    this.charts.sales = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Vendas',
          data: data,
          borderColor: '#b5179e',
          backgroundColor: 'rgba(181, 23, 158, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2,
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: this.currentTimeframe === 'daily' ? 12 : 10,
              callback: (value, index, ticks) => {
                if (this.currentTimeframe === 'daily') {
                  // Para período diário, mostrar apenas algumas horas (de 2 em 2)
                  const label = labels[value];
                  const hour = parseInt(label.split(':')[0]);
                  return hour % 2 === 0 ? label : '';
                }
                return labels[value];
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value);
              }
            }
          }
        },
        elements: {
          point: {
            radius: 4,
            hoverRadius: 6
          },
          line: {
            borderWidth: 2
          }
        }
      }
    });
  }

  async updateTopProductsChart(products) {
    console.log('[DEBUG] updateTopProductsChart: Iniciando com', products.length, 'produtos');
    const container = document.getElementById('topProducts');
    if (!container) {
      console.log('[DEBUG] updateTopProductsChart: Container topProducts não encontrado');
      return;
    }

    // Limpar container
    container.innerHTML = '';

    // Ordenar produtos por preço (maior primeiro) - MOSTRAR TODOS
    const sortedProducts = products
      .sort((a, b) => b.price - a.price);

    console.log('[DEBUG] updateTopProductsChart: Produtos ordenados:', sortedProducts.map(p => `${p.name}: R$ ${p.price}`));

    if (sortedProducts.length === 0) {
      container.innerHTML = '<div class="empty-products">Nenhum produto cadastrado</div>';
      return;
    }

    // Criar header com informações
    const header = document.createElement('div');
    header.className = 'products-header';
    header.innerHTML = `
      <div class="header-info">
        <h4>Catálogo de Produtos</h4>
        <span class="products-count">${sortedProducts.length} produto${sortedProducts.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="header-controls">
        <button class="btn-sort" onclick="app.sortProducts('price')" title="Ordenar por preço">
          <i class="fas fa-sort-amount-down"></i> Preço
        </button>
        <button class="btn-sort" onclick="app.sortProducts('name')" title="Ordenar por nome">
          <i class="fas fa-sort-alpha-down"></i> Nome
        </button>
        <button class="btn-sort" onclick="app.toggleView()" title="Alternar visualização">
          <i class="fas fa-th"></i> Grid
        </button>
      </div>
    `;

    // Criar lista de produtos
    const productsList = document.createElement('div');
    productsList.className = 'all-products-list';
    productsList.id = 'allProductsList';

    sortedProducts.forEach((product, index) => {
      const productItem = document.createElement('div');
      productItem.className = 'product-item';
      productItem.style.animationDelay = `${index * 0.05}s`;

      const rank = index + 1;
      const percentage = sortedProducts.length > 0 ? 
        ((product.price / sortedProducts[0].price) * 100).toFixed(0) : 0;

      productItem.innerHTML = `
        <div class="product-rank">
          <span class="rank-number">${rank}</span>
        </div>
        <div class="product-info">
          <div class="product-name" title="${product.name}">${product.name}</div>
          <div class="product-details">
            <span class="product-price">${this.formatCurrency(product.price)}</span>
            <span class="product-stock">Estoque: ${product.stock || 0}</span>
          </div>
        </div>
        <div class="product-bar">
          <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="product-percentage">${percentage}%</div>
        <div class="product-actions">
          <button class="btn-action" onclick="app.showEditProductModal('${product.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-danger" onclick="app.showDeleteProductModal('${product.id}')" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      productsList.appendChild(productItem);
    });

    container.appendChild(header);
    container.appendChild(productsList);

    // Atualizar estatísticas do card de top produtos
    await this.updateTopProductsStats(sortedProducts);

    // Armazenar produtos para ordenação
    this.allProducts = sortedProducts;
    
    // Log para debug
    console.log(`GEX App: Mostrando ${sortedProducts.length} produtos no catálogo`);
  }

  // Atualizar estatísticas do card de top produtos
  async updateTopProductsStats(products) {
    const totalProductsEl = document.getElementById('totalProductsCount');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalProductsEl) {
      totalProductsEl.textContent = products.length.toString();
    }
    
    if (totalRevenueEl) {
      try {
        // Buscar vendas do usuário para calcular receita real
        const sales = await this.dbManager.getSalesByUser(this.currentUser.id);
        
        // Calcular receita total baseada nas vendas reais
        const totalRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
        totalRevenueEl.textContent = this.formatCurrency(totalRevenue);
        
        console.log(`💰 Receita total calculada: ${totalRevenue} baseada em ${sales.length} vendas`);
      } catch (error) {
        console.error('Erro ao calcular receita total:', error);
        // Fallback: usar preço dos produtos se não conseguir buscar vendas
        const totalRevenue = products.reduce((sum, product) => sum + (product.price || 0), 0);
        totalRevenueEl.textContent = this.formatCurrency(totalRevenue);
      }
    }
  }

  // Função para ordenar produtos
  sortProducts(sortBy) {
    if (!this.allProducts) return;

    let sortedProducts;
    if (sortBy === 'price') {
      sortedProducts = [...this.allProducts].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      sortedProducts = [...this.allProducts].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Atualizar a lista
    const productsList = document.getElementById('allProductsList');
    if (!productsList) return;

    productsList.innerHTML = '';

    sortedProducts.forEach((product, index) => {
      const productItem = document.createElement('div');
      productItem.className = 'product-item';
      productItem.style.animationDelay = `${index * 0.05}s`;

      const rank = index + 1;
      const percentage = sortedProducts.length > 0 ? 
        ((product.price / sortedProducts[0].price) * 100).toFixed(0) : 0;

      productItem.innerHTML = `
        <div class="product-rank">
          <span class="rank-number">${rank}</span>
        </div>
        <div class="product-info">
          <div class="product-name" title="${product.name}">${product.name}</div>
          <div class="product-details">
            <span class="product-price">${this.formatCurrency(product.price)}</span>
            <span class="product-stock">Estoque: ${product.stock || 0}</span>
          </div>
        </div>
        <div class="product-bar">
          <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="product-percentage">${percentage}%</div>
        <div class="product-actions">
          <button class="btn-action" onclick="app.showEditProductModal('${product.id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-danger" onclick="app.showDeleteProductModal('${product.id}')" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      productsList.appendChild(productItem);
    });

    this.allProducts = sortedProducts;
  }

  // Função para alternar entre lista e grid
  toggleView() {
    const productsList = document.getElementById('allProductsList');
    if (!productsList) return;

    if (productsList.classList.contains('grid-view')) {
      productsList.classList.remove('grid-view');
      productsList.classList.add('list-view');
    } else {
      productsList.classList.remove('list-view');
      productsList.classList.add('grid-view');
    }
  }


  // Atualização de tabelas
  updateProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    products.forEach(product => {
      const profit = this.calculateProfit(product.price, product.cost || 0);
      const margin = this.calculateMargin(product.price, product.cost || 0);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${this.formatCurrency(product.cost || 0)}</td>
        <td>${this.formatCurrency(product.price)}</td>
        <td>${this.formatCurrency(profit)}</td>
        <td>${margin.toFixed(1)}%</td>
        <td>${product.stock}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="app.showEditProductModal('${product.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="app.showDeleteProductModal('${product.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateSalesTable(sales) {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Ordenar vendas por data e horário (mais recente primeiro)
    const sortedSales = sales.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });

    sortedSales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const row = document.createElement('tr');
      const timeString = sale.time || saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dateTimeString = `${saleDate.toLocaleDateString('pt-BR')} ${timeString}`;
      
      row.innerHTML = `
        <td>${dateTimeString}</td>
        <td>${sale.productName}</td>
        <td>${sale.quantity}</td>
        <td>${this.formatCurrency(sale.price)}</td>
        <td>${this.formatCurrency(sale.amount)}</td>
        <td>${this.formatCurrency(sale.profit || 0)}</td>
        <td>${sale.margin ? sale.margin.toFixed(1) + '%' : '-'}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="app.deleteSale('${sale.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Atualização do resumo de vendas
  updateSalesSummary(sales) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCost = sales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalOrders = sales.length;
    const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Atualizar elementos
    const revenueEl = document.getElementById('salesTotalRevenue');
    const profitEl = document.getElementById('salesTotalProfit');
    const marginEl = document.getElementById('salesAvgMargin');
    const ordersEl = document.getElementById('salesTotalOrders');

    if (revenueEl) revenueEl.textContent = this.formatCurrency(totalRevenue);
    if (profitEl) profitEl.textContent = this.formatCurrency(totalProfit);
    if (marginEl) marginEl.textContent = avgMargin.toFixed(1) + '%';
    if (ordersEl) ordersEl.textContent = totalOrders.toString();
  }

  // Atualização do resumo de produtos
  updateProductsSummary(products) {
    const totalProducts = products.length;
    
    // Calcular valor total do estoque (preço × estoque)
    const totalValue = products.reduce((sum, product) => {
      const price = product.price || 0;
      const stock = product.stock || 0;
      return sum + (price * stock);
    }, 0);
    
    // Calcular lucro total potencial (lucro unitário × estoque)
    const totalProfit = products.reduce((sum, product) => {
      const price = product.price || 0;
      const cost = product.cost || 0;
      const stock = product.stock || 0;
      const unitProfit = price - cost;
      return sum + (unitProfit * stock);
    }, 0);
    
    // Calcular margem média
    const totalRevenue = products.reduce((sum, product) => sum + (product.price || 0), 0);
    const totalCosts = products.reduce((sum, product) => sum + (product.cost || 0), 0);
    const avgMargin = totalRevenue > 0 ? (((totalRevenue - totalCosts) / totalRevenue) * 100) : 0;

    // Atualizar elementos
    const countEl = document.getElementById('productsTotalCount');
    const valueEl = document.getElementById('productsTotalValue');
    const profitEl = document.getElementById('productsTotalProfit');
    const marginEl = document.getElementById('productsAvgMargin');

    if (countEl) countEl.textContent = totalProducts.toString();
    if (valueEl) valueEl.textContent = this.formatCurrency(totalValue);
    if (profitEl) profitEl.textContent = this.formatCurrency(totalProfit);
    if (marginEl) marginEl.textContent = avgMargin.toFixed(1) + '%';
  }

  updateDashboardSalesTable(sales) {
    const tbody = document.getElementById('dashboardSalesTableBody');
    if (!tbody) return;

    console.log(`[DEBUG] updateDashboardSalesTable: Recebidas ${sales.length} vendas`);
    console.log(`[DEBUG] Período ativo: ${this.currentTimeframe}`);
    
    tbody.innerHTML = '';

    if (sales.length === 0) {
      console.log('[DEBUG] Nenhuma venda para exibir');
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <h3>Nenhuma venda registrada</h3>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Agrupar vendas por período baseado no timeframe atual
    let groupedData = {};
    
    if (this.currentTimeframe === 'daily') {
      // Agrupar por data
      sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString('pt-BR');
        if (!groupedData[date]) {
          groupedData[date] = {
            period: date,
            revenue: 0,
            costs: 0,
            profit: 0,
            margin: 0,
            orders: 0,
            avgTicket: 0,
            items: 0
          };
        }
        groupedData[date].revenue += sale.amount;
        groupedData[date].costs += (sale.totalCost || 0);
        groupedData[date].orders += 1;
        groupedData[date].items += sale.quantity;
      });
    } else if (this.currentTimeframe === 'weekly') {
      // Agrupar por semana
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const weekStart = new Date(saleDate);
        weekStart.setDate(saleDate.getDate() - saleDate.getDay());
        const weekLabel = `Semana ${weekStart.toLocaleDateString('pt-BR')}`;
        
        if (!groupedData[weekLabel]) {
          groupedData[weekLabel] = {
            period: weekLabel,
            revenue: 0,
            costs: 0,
            profit: 0,
            margin: 0,
            orders: 0,
            avgTicket: 0,
            items: 0
          };
        }
        groupedData[weekLabel].revenue += sale.amount;
        groupedData[weekLabel].costs += (sale.totalCost || 0);
        groupedData[weekLabel].orders += 1;
        groupedData[weekLabel].items += sale.quantity;
      });
    } else if (this.currentTimeframe === 'monthly') {
      // Agrupar por mês
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const monthLabel = saleDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        if (!groupedData[monthLabel]) {
          groupedData[monthLabel] = {
            period: monthLabel,
            revenue: 0,
            costs: 0,
            profit: 0,
            margin: 0,
            orders: 0,
            avgTicket: 0,
            items: 0
          };
        }
        groupedData[monthLabel].revenue += sale.amount;
        groupedData[monthLabel].costs += (sale.totalCost || 0);
        groupedData[monthLabel].orders += 1;
        groupedData[monthLabel].items += sale.quantity;
      });
    } else if (this.currentTimeframe === 'yearly') {
      // Agrupar por ano
      sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const yearLabel = saleDate.getFullYear().toString();
        
        if (!groupedData[yearLabel]) {
          groupedData[yearLabel] = {
            period: yearLabel,
            revenue: 0,
            costs: 0,
            profit: 0,
            margin: 0,
            orders: 0,
            avgTicket: 0,
            items: 0
          };
        }
        groupedData[yearLabel].revenue += sale.amount;
        groupedData[yearLabel].costs += (sale.totalCost || 0);
        groupedData[yearLabel].orders += 1;
        groupedData[yearLabel].items += sale.quantity;
      });
    }

    // Calcular métricas para cada período
    Object.values(groupedData).forEach(period => {
      period.avgTicket = period.orders > 0 ? period.revenue / period.orders : 0;
      // Aqui você pode adicionar cálculos de custos e lucro se tiver esses dados
      period.margin = period.revenue > 0 ? ((period.revenue - period.costs) / period.revenue) * 100 : 0;
      period.profit = period.revenue - period.costs;
    });

    // Ordenar por período (mais recente primeiro)
    const sortedPeriods = Object.values(groupedData).sort((a, b) => {
      if (this.currentTimeframe === 'daily') {
        return new Date(b.period.split('/').reverse().join('-')) - new Date(a.period.split('/').reverse().join('-'));
      }
      return b.period.localeCompare(a.period);
    });

    // Criar linhas da tabela
    console.log(`[DEBUG] Criando ${sortedPeriods.length} linhas na tabela`);
    
    sortedPeriods.forEach((period, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${period.period}</td>
        <td>${this.formatCurrency(period.revenue)}</td>
        <td>${this.formatCurrency(period.costs)}</td>
        <td>${this.formatCurrency(period.profit)}</td>
        <td>${period.margin.toFixed(1)}%</td>
        <td>${period.orders}</td>
        <td>${this.formatCurrency(period.avgTicket)}</td>
        <td>${period.items}</td>
      `;
      tbody.appendChild(row);
      
      if (index < 3) { // Log apenas os primeiros 3 para não poluir
        console.log(`[DEBUG] Período ${index + 1}: ${period.period} - ${period.orders} pedidos - R$ ${period.revenue}`);
      }
    });
    
    console.log(`[DEBUG] Tabela atualizada com ${sortedPeriods.length} períodos`);
    
    // Verificar se há scroll disponível após atualizar a tabela
    setTimeout(() => {
      this.checkTableScroll();
    }, 100);
  }

  // Verificar se a tabela do dashboard tem scroll disponível
  checkTableScroll() {
    const tableWrap = document.querySelector('#dashboard-page .table-wrap');
    const tableSection = document.querySelector('#dashboard-page .table-section');
    
    if (!tableWrap || !tableSection) return;
    
    // Verificar se há scroll vertical disponível
    const hasVerticalScroll = tableWrap.scrollHeight > tableWrap.clientHeight;
    const hasHorizontalScroll = tableWrap.scrollWidth > tableWrap.clientWidth;
    
    console.log(`[DEBUG] Verificação de scroll - Vertical: ${hasVerticalScroll}, Horizontal: ${hasHorizontalScroll}`);
    console.log(`[DEBUG] Dimensões - scrollHeight: ${tableWrap.scrollHeight}, clientHeight: ${tableWrap.clientHeight}`);
    
    // Adicionar ou remover classe para mostrar indicador
    if (hasVerticalScroll || hasHorizontalScroll) {
      tableSection.classList.add('has-scroll');
      console.log('[DEBUG] Indicador de scroll ativado');
    } else {
      tableSection.classList.remove('has-scroll');
      console.log('[DEBUG] Indicador de scroll desativado');
    }
  }



  // Funções auxiliares para cálculos
  calculateProfit(price, cost) {
    return price - cost;
  }

  calculateMargin(price, cost) {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  }

  // Manipulação de formulários
  async handleProductSubmit(e) {
    e.preventDefault();
    
    console.log('🔍 Verificando usuário atual:', this.currentUser);
    
    if (!this.currentUser) {
      console.error('❌ Usuário não logado!');
      this.showNotification('Você precisa estar logado para adicionar produtos', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const product = {
      name: formData.get('name'),
      cost: parseFloat(formData.get('cost')),
      price: parseFloat(formData.get('price')),
      stock: parseInt(formData.get('stock'))
    };

    console.log('📦 Adicionando produto:', product, 'para usuário:', this.currentUser.id);

    try {
      await this.dbManager.addProduct(product, this.currentUser.id);
      this.hideModal('productModal');
      this.showNotification('Produto adicionado com sucesso!', 'success');
      this.loadProductsData();
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      this.showNotification('Erro ao adicionar produto', 'error');
    }
  }

  async handleSaleSubmit(e) {
    e.preventDefault();
    
    console.log('🔍 Verificando usuário atual para venda:', this.currentUser);
    
    if (!this.currentUser) {
      console.error('❌ Usuário não logado!');
      this.showNotification('Você precisa estar logado para registrar vendas', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const saleDate = formData.get('date');
    const saleTime = formData.get('time');

    try {
      // Obter produtos da venda
      const productRows = document.querySelectorAll('.sale-product-row');
      const sales = [];

      for (const row of productRows) {
        const productSelect = row.querySelector('.product-select');
        const quantityInput = row.querySelector('.product-quantity');
        const priceInput = row.querySelector('.product-price');

        if (productSelect.value && quantityInput.value && priceInput.value) {
          const productId = productSelect.value;
          const productName = productSelect.selectedOptions[0].textContent;
          const quantity = parseInt(quantityInput.value);
          const price = parseFloat(priceInput.value);
          const amount = quantity * price;

          // Buscar o produto para obter o custo
          const product = await this.dbManager.get('products', productId);
          const cost = product ? product.cost : 0;
          const totalCost = cost * quantity;
          const profit = this.calculateProfit(amount, totalCost);
          const margin = this.calculateMargin(amount, totalCost);

          sales.push({
            productId,
            productName,
            quantity,
            price,
            amount,
            cost,
            totalCost,
            profit,
            margin,
            date: saleDate,
            time: saleTime
          });
        }
      }

      if (sales.length === 0) {
        this.showNotification('Adicione pelo menos um produto à venda', 'error');
        return;
      }

      // Salvar cada produto como uma venda separada e atualizar estoque
      for (const sale of sales) {
        // Verificar se há estoque suficiente
        const product = await this.dbManager.get('products', sale.productId);
        if (!product) {
          this.showNotification(`Produto ${sale.productName} não encontrado`, 'error');
          return;
        }

        if (product.stock < sale.quantity) {
          this.showNotification(`Estoque insuficiente para ${sale.productName}. Disponível: ${product.stock}`, 'error');
          return;
        }

        // Adicionar venda
        await this.dbManager.addSale(sale, this.currentUser.id);
        
        // Atualizar estoque (diminuir quantidade vendida)
        await this.dbManager.updateProductStock(sale.productId, -sale.quantity);
        
        console.log(`✅ Estoque atualizado para ${sale.productName}: ${product.stock} → ${product.stock - sale.quantity}`);
      }

      this.hideModal('saleModal');
      this.showNotification(`Venda registrada com sucesso! ${sales.length} produto(s) adicionado(s).`, 'success');
      this.loadSalesData();
      this.loadProductsData(); // Atualizar lista de produtos para mostrar novo estoque
      this.loadDashboardData(); // Atualizar dashboard também

    } catch (error) {
      console.error('Erro ao registrar venda:', error);
      this.showNotification('Erro ao registrar venda', 'error');
    }
  }

  async handleCostSubmit(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const cost = {
      description: formData.get('description'),
      category: formData.get('category'),
      value: parseFloat(formData.get('value')),
      date: formData.get('date')
    };

    try {
      await this.dbManager.addCost(cost, this.currentUser.id);
      this.hideModal('costModal');
      this.showNotification('Custo adicionado com sucesso!', 'success');
      this.loadCostsData();
    } catch (error) {
      console.error('Erro ao adicionar custo:', error);
      this.showNotification('Erro ao adicionar custo', 'error');
    }
  }

  async handleCustomCostSubmit(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const cost = {
      description: formData.get('description'),
      category: formData.get('category'),
      value: parseFloat(formData.get('value')),
      date: formData.get('date'),
      notes: formData.get('notes')
    };

    try {
      await this.dbManager.addCost(cost, this.currentUser.id);
      this.hideModal('customCostModal');
      this.showNotification('Custo personalizado adicionado com sucesso!', 'success');
      this.loadCostsData();
    } catch (error) {
      console.error('Erro ao adicionar custo personalizado:', error);
      this.showNotification('Erro ao adicionar custo personalizado', 'error');
    }
  }

  async handleTaxSubmit(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const tax = {
      description: formData.get('description'),
      type: formData.get('type'),
      value: parseFloat(formData.get('value')),
      date: formData.get('date'),
      notes: formData.get('notes')
    };

    try {
      await this.dbManager.addTax(tax, this.currentUser.id);
      this.hideModal('taxModal');
      this.showNotification('Imposto adicionado com sucesso!', 'success');
      this.loadCostsData();
    } catch (error) {
      console.error('Erro ao adicionar imposto:', error);
      this.showNotification('Erro ao adicionar imposto', 'error');
    }
  }

  async handlePersonalInfoSubmit(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const updatedUser = {
      ...this.currentUser,
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email')
    };

    try {
      await this.dbManager.updateUser(updatedUser);
      this.currentUser = updatedUser;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.updateProfileInfo();
      this.showNotification('Informações atualizadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      this.showNotification('Erro ao atualizar informações', 'error');
    }
  }

  async handlePasswordChange(e) {
    e.preventDefault();
    if (!this.currentUser) return;

    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmNewPassword');

    if (newPassword !== confirmPassword) {
      this.showNotification('As senhas não coincidem', 'error');
      return;
    }

    try {
      const updatedUser = {
        ...this.currentUser,
        password: newPassword
      };
      await this.dbManager.updateUser(updatedUser);
      this.currentUser = updatedUser;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.showNotification('Senha alterada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.showNotification('Erro ao alterar senha', 'error');
    }
  }

  // Funções auxiliares
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  setTimeframe(range) {
    // Armazenar período atual
    this.currentTimeframe = range;
    
    // Atualizar botões ativos
    document.querySelectorAll('.tf-btn, .demo-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    document.querySelectorAll(`[data-range="${range}"]`).forEach(btn => {
      btn.classList.add('active');
    });

    // Recarregar dados com novo período
    this.loadPageData(this.currentPage);
  }

  // Modais específicos
  showProductModal() {
    this.showModal('productModal');
  }

  showCustomCostModal() {
    // Definir data padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('customCostDate');
    if (dateInput) dateInput.value = today;
    
    this.showModal('customCostModal');
  }

  showTaxModal() {
    // Definir data padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('taxDate');
    if (dateInput) dateInput.value = today;
    
    this.showModal('taxModal');
  }

  showSaleModal() {
    // Definir data e horário padrão
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const dateInput = document.getElementById('saleDate');
    const timeInput = document.getElementById('saleTime');
    
    if (dateInput) dateInput.value = today;
    if (timeInput) timeInput.value = currentTime;
    
    // Limpar lista de produtos
    const productsList = document.getElementById('productsList');
    if (productsList) productsList.innerHTML = '';
    
    // Adicionar primeiro produto
    this.addSaleProductRow();
    
    this.showModal('saleModal');
  }


  // Ações de CRUD

  async deleteSale(id) {
    console.log(`🔍 DEBUG: deleteSale chamada com ID: ${id}`);
    
    try {
      // Buscar dados da venda para exibir no modal
      console.log('🔍 DEBUG: Buscando dados da venda...');
      const sale = await this.dbManager.get('sales', id);
      if (!sale) {
        console.log('❌ DEBUG: Venda não encontrada');
        this.showNotification('Venda não encontrada', 'error');
        return;
      }

      console.log(`✅ DEBUG: Venda encontrada: ${sale.productName}`);

      // Preencher informações da venda no modal
      document.getElementById('deleteSaleProduct').textContent = sale.productName || 'Produto não especificado';
      document.getElementById('deleteSaleQuantity').textContent = sale.quantity || 0;
      document.getElementById('deleteSaleAmount').textContent = this.formatCurrency(sale.amount || 0);
      
      // Formatar data
      const saleDate = new Date(sale.date);
      const formattedDate = saleDate.toLocaleDateString('pt-BR') + ' ' + (sale.time || '');
      document.getElementById('deleteSaleDate').textContent = formattedDate;

      // Armazenar ID da venda para exclusão
      this.deletingSaleId = id;
      console.log(`✅ DEBUG: ID da venda armazenado: ${this.deletingSaleId}`);

      // Mostrar modal
      console.log('🔍 DEBUG: Mostrando modal de exclusão...');
      this.showModal('deleteSaleModal');
      console.log('✅ DEBUG: Modal de exclusão exibido');
    } catch (error) {
      console.error('❌ DEBUG: Erro ao buscar venda:', error);
      this.showNotification('Erro ao carregar dados da venda', 'error');
    }
  }

  async deleteCost(id) {
    if (confirm('Tem certeza que deseja excluir este custo?')) {
      try {
        await this.dbManager.deleteCost(id);
        this.showNotification('Custo excluído com sucesso!', 'success');
        this.loadCostsData();
      } catch (error) {
        console.error('Erro ao excluir custo:', error);
        this.showNotification('Erro ao excluir custo', 'error');
      }
    }
  }

  async deleteTax(id) {
    if (confirm('Tem certeza que deseja excluir este imposto?')) {
      try {
        await this.dbManager.deleteTax(id);
        this.showNotification('Imposto excluído com sucesso!', 'success');
        this.loadCostsData();
      } catch (error) {
        console.error('Erro ao excluir imposto:', error);
        this.showNotification('Erro ao excluir imposto', 'error');
      }
    }
  }

  // Upload de foto
  handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        this.currentUser.photo = event.target.result;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateProfileInfo();
        this.showNotification('Foto atualizada com sucesso!', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.currentUser.photo = null;
    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    this.updateProfileInfo();
    this.showNotification('Foto removida com sucesso!', 'success');
  }

  async deleteAccount() {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      try {
        await this.dbManager.deleteUser(this.currentUser.id);
        this.logout();
        this.showNotification('Conta excluída com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao excluir conta:', error);
        this.showNotification('Erro ao excluir conta', 'error');
      }
    }
  }

  // Adicionar produto na venda
  addSaleProductRow() {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;

    const productRow = document.createElement('div');
    productRow.className = 'sale-product-row';
    productRow.innerHTML = `
      <div class="form-group">
        <label>Produto:</label>
        <select class="product-select" required>
          <option value="">Selecione um produto</option>
        </select>
      </div>
      <div class="form-group">
        <label>Quantidade:</label>
        <input type="number" class="product-quantity" min="1" value="1" required>
      </div>
      <div class="form-group">
        <label>Preço:</label>
        <input type="number" class="product-price" step="0.01" min="0" required>
      </div>
      <button type="button" class="btn btn-danger btn-sm remove-product">
        <i class="fas fa-trash"></i>
      </button>
    `;

    productsList.appendChild(productRow);

    // Carregar produtos no select
    this.loadProductsForSale(productRow);

    // Event listener para remover produto
    const removeBtn = productRow.querySelector('.remove-product');
    removeBtn.addEventListener('click', () => productRow.remove());

    // Atualizar total da venda quando valores mudarem
    const quantityInput = productRow.querySelector('.product-quantity');
    const priceInput = productRow.querySelector('.product-price');
    
    const updateTotal = () => this.updateSaleTotal();
    
    // Validação de quantidade em tempo real
    quantityInput.addEventListener('input', (e) => {
      const select = productRow.querySelector('.product-select');
      const selectedOption = select.selectedOptions[0];
      
      if (selectedOption && selectedOption.dataset.stock) {
        const maxStock = parseInt(selectedOption.dataset.stock);
        const currentQuantity = parseInt(e.target.value) || 0;
        
        if (currentQuantity > maxStock) {
          e.target.value = maxStock;
          this.showNotification(`Quantidade máxima disponível: ${maxStock}`, 'warning');
        }
      }
      
      updateTotal();
    });
    
    priceInput.addEventListener('input', updateTotal);
  }

  async loadProductsForSale(productRow) {
    if (!this.currentUser) return;

    try {
      const products = await this.dbManager.getProductsByUser(this.currentUser.id);
      const select = productRow.querySelector('.product-select');
      
      // Limpar opções existentes
      select.innerHTML = '<option value="">Selecione um produto</option>';
      
      // Adicionar produtos (apenas os com estoque > 0)
      products.forEach(product => {
        if (product.stock > 0) {
          const option = document.createElement('option');
          option.value = product.id;
          option.textContent = `${product.name} - Estoque: ${product.stock || 0}`;
          option.dataset.price = product.price;
          option.dataset.stock = product.stock;
          select.appendChild(option);
        }
      });

      // Event listener para atualizar preço e validar estoque
      select.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption) {
          const priceInput = productRow.querySelector('.product-price');
          const quantityInput = productRow.querySelector('.product-quantity');
          
          priceInput.value = selectedOption.dataset.price;
          
          // Configurar quantidade máxima baseada no estoque
          const maxStock = parseInt(selectedOption.dataset.stock);
          quantityInput.max = maxStock;
          quantityInput.placeholder = `Máximo: ${maxStock}`;
          
          // Se a quantidade atual for maior que o estoque disponível, ajustar
          if (parseInt(quantityInput.value) > maxStock) {
            quantityInput.value = maxStock;
          }
          
          this.updateSaleTotal(); // Atualizar total quando produto mudar
        }
      });
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  }

  // Atualizar total da venda
  updateSaleTotal() {
    const productRows = document.querySelectorAll('.sale-product-row');
    let totalProducts = 0;
    let totalValue = 0;

    productRows.forEach(row => {
      const quantityInput = row.querySelector('.product-quantity');
      const priceInput = row.querySelector('.product-price');
      
      if (quantityInput.value && priceInput.value) {
        const quantity = parseInt(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const subtotal = quantity * price;
        
        totalProducts += quantity;
        totalValue += subtotal;
      }
    });

    // Atualizar elementos da interface
    const totalProductsEl = document.getElementById('totalProducts');
    const saleTotalEl = document.getElementById('saleTotal');
    
    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (saleTotalEl) saleTotalEl.textContent = this.formatCurrency(totalValue);
  }

  // ===== FUNÇÕES DE EDIÇÃO E EXCLUSÃO DE PRODUTOS =====

  // Mostrar modal de edição de produto
  showEditProductModal(productId) {
    if (!this.currentUser) {
      this.showNotification('Você precisa estar logado para editar produtos', 'error');
      return;
    }

    // Buscar produto no banco de dados
    this.dbManager.get('products', productId).then(product => {
      if (!product) {
        this.showNotification('Produto não encontrado', 'error');
        return;
      }

      // Preencher formulário com dados do produto
      document.getElementById('editProductName').value = product.name || '';
      document.getElementById('editProductCost').value = product.cost || 0;
      document.getElementById('editProductPrice').value = product.price || 0;
      document.getElementById('editProductStock').value = product.stock || 0;
      document.getElementById('editProductCategory').value = product.category || 'outros';
      document.getElementById('editProductDescription').value = product.description || '';

      // Armazenar ID do produto para edição
      this.editingProductId = productId;

      // Mostrar modal
      this.showModal('editProductModal');
    }).catch(error => {
      console.error('Erro ao buscar produto:', error);
      this.showNotification('Erro ao carregar dados do produto', 'error');
    });
  }

  // Mostrar modal de confirmação de exclusão
  async showDeleteProductModal(productId) {
    if (!this.currentUser) {
      this.showNotification('Você precisa estar logado para excluir produtos', 'error');
      return;
    }

    try {
      // Buscar produto no banco de dados
      const product = await this.dbManager.get('products', productId);
      if (!product) {
        this.showNotification('Produto não encontrado', 'error');
        return;
      }

      // Buscar vendas associadas ao produto
      const associatedSales = await this.dbManager.getSalesByProduct(productId);

      // Preencher informações do produto no modal
      document.getElementById('deleteProductName').textContent = product.name || 'Produto sem nome';
      document.getElementById('deleteProductPrice').textContent = this.formatCurrency(product.price || 0);

      // Mostrar informações das vendas associadas
      const salesInfoEl = document.getElementById('deleteProductSalesInfo');
      const salesCountEl = document.getElementById('deleteProductSalesCount');
      
      if (associatedSales && associatedSales.length > 0) {
        salesCountEl.textContent = `${associatedSales.length} venda(s)`;
        salesInfoEl.style.display = 'block';
      } else {
        salesInfoEl.style.display = 'none';
      }

      // Armazenar ID do produto para exclusão
      this.deletingProductId = productId;

      // Mostrar modal
      this.showModal('deleteProductModal');
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      this.showNotification('Erro ao carregar dados do produto', 'error');
    }
  }

  // Salvar alterações do produto
  async handleEditProductSubmit(e) {
    e.preventDefault();
    
    if (!this.currentUser || !this.editingProductId) {
      this.showNotification('Erro: usuário não logado ou produto não selecionado', 'error');
      return;
    }

    try {
      const formData = new FormData(e.target);
      const updatedProduct = {
        name: formData.get('name').trim(),
        cost: parseFloat(formData.get('cost')),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        category: formData.get('category'),
        description: formData.get('description').trim(),
        updatedAt: new Date().toISOString()
      };

      // Validar dados
      if (!updatedProduct.name) {
        this.showNotification('Nome do produto é obrigatório', 'error');
        return;
      }

      if (updatedProduct.price < 0) {
        this.showNotification('Preço não pode ser negativo', 'error');
        return;
      }

      if (updatedProduct.stock < 0) {
        this.showNotification('Estoque não pode ser negativo', 'error');
        return;
      }

      // Atualizar produto no banco de dados
      await this.dbManager.update('products', this.editingProductId, updatedProduct);

      // Fechar modal
      this.hideModal('editProductModal');

      // Mostrar notificação de sucesso
      this.showNotification(`Produto "${updatedProduct.name}" atualizado com sucesso!`, 'success');

      // Recarregar dados
      await this.loadProductsData();
      await this.loadDashboardData();

      // Limpar ID de edição
      this.editingProductId = null;

    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      this.showNotification('Erro ao atualizar produto', 'error');
    }
  }

  // Confirmar exclusão do produto
  async handleDeleteProductConfirm() {
    if (!this.currentUser || !this.deletingProductId) {
      this.showNotification('Erro: usuário não logado ou produto não selecionado', 'error');
      return;
    }

    try {
      // Buscar nome do produto antes de excluir
      const product = await this.dbManager.get('products', this.deletingProductId);
      const productName = product ? product.name : 'Produto';

      // Buscar vendas associadas ao produto
      console.log(`🔍 Buscando vendas para produto ID: ${this.deletingProductId}`);
      const associatedSales = await this.dbManager.getSalesByProduct(this.deletingProductId);
      console.log(`📊 Vendas encontradas: ${associatedSales ? associatedSales.length : 0}`);
      
      if (associatedSales && associatedSales.length > 0) {
        console.log(`🗑️ Excluindo ${associatedSales.length} venda(s) associada(s) ao produto "${productName}"`);
        
        for (const sale of associatedSales) {
          console.log(`🗑️ Excluindo venda ID: ${sale.id} (${sale.productName})`);
          await this.dbManager.deleteSale(sale.id);
          console.log(`✅ Venda ID: ${sale.id} excluída com sucesso`);
        }
        
        console.log(`✅ ${associatedSales.length} venda(s) excluída(s) com sucesso`);
      } else {
        console.log(`ℹ️ Nenhuma venda encontrada para o produto "${productName}"`);
      }

      // Excluir produto do banco de dados
      await this.dbManager.delete('products', this.deletingProductId);

      // Fechar modal
      this.hideModal('deleteProductModal');

      // Mostrar notificação de sucesso
      const message = associatedSales && associatedSales.length > 0 
        ? `Produto "${productName}" e ${associatedSales.length} venda(s) associada(s) excluído(s) com sucesso!`
        : `Produto "${productName}" excluído com sucesso!`;
      
      this.showNotification(message, 'success');

      // Recarregar dados
      await this.loadProductsData();
      await this.loadDashboardData();

      // Limpar ID de exclusão
      this.deletingProductId = null;

    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      this.showNotification('Erro ao excluir produto', 'error');
    }
  }

  // Cancelar edição de produto
  cancelEditProduct() {
    this.hideModal('editProductModal');
    this.editingProductId = null;
  }

  // Cancelar exclusão de produto
  cancelDeleteProduct() {
    this.hideModal('deleteProductModal');
    this.deletingProductId = null;
  }

  // Confirmar exclusão de venda
  async confirmDeleteSale() {
    console.log('🔍 DEBUG: confirmDeleteSale chamada, deletingSaleId:', this.deletingSaleId);
    
    if (!this.deletingSaleId) {
      console.log('❌ DEBUG: Nenhum ID de venda para excluir');
      this.showNotification('Erro: Nenhuma venda selecionada para exclusão', 'error');
      return;
    }

    try {
      console.log(`🔍 DEBUG: Buscando venda ID: ${this.deletingSaleId}`);
      
      // Buscar dados da venda antes de excluir
      const sale = await this.dbManager.get('sales', this.deletingSaleId);
      if (!sale) {
        console.log('❌ DEBUG: Venda não encontrada');
        this.showNotification('Venda não encontrada', 'error');
        return;
      }

      console.log(`✅ DEBUG: Venda encontrada: ${sale.productName}, Quantidade: ${sale.quantity}`);

      // Excluir venda
      console.log('🗑️ DEBUG: Excluindo venda...');
      await this.dbManager.deleteSale(this.deletingSaleId);
      console.log('✅ DEBUG: Venda excluída com sucesso');

      // Restaurar estoque do produto
      if (sale.productId && sale.quantity) {
        console.log(`📦 DEBUG: Restaurando estoque para produto ${sale.productId}: +${sale.quantity}`);
        await this.dbManager.updateProductStock(sale.productId, sale.quantity);
        console.log(`✅ Estoque restaurado para produto ${sale.productId}: +${sale.quantity}`);
      }

      // Fechar modal
      this.hideModal('deleteSaleModal');

      // Mostrar notificação de sucesso
      this.showNotification(`Venda de "${sale.productName}" excluída com sucesso!`, 'success');

      // Recarregar dados
      console.log('🔄 DEBUG: Recarregando dados...');
      await this.loadSalesData();
      await this.loadProductsData(); // Atualizar estoque na lista de produtos
      await this.loadDashboardData();
      console.log('✅ DEBUG: Dados recarregados');

      // Limpar ID de exclusão
      this.deletingSaleId = null;
      console.log('✅ DEBUG: Exclusão de venda concluída com sucesso');
    } catch (error) {
      console.error('❌ DEBUG: Erro ao excluir venda:', error);
      this.showNotification('Erro ao excluir venda', 'error');
    }
  }

  // Cancelar exclusão de venda
  cancelDeleteSale() {
    this.hideModal('deleteSaleModal');
    this.deletingSaleId = null;
  }

  // Configurar event listeners para modais de exclusão
  setupDeleteModalEventListeners() {
    // Modal de exclusão de produto
    const confirmDeleteProduct = document.getElementById('confirmDeleteProduct');
    if (confirmDeleteProduct) {
      confirmDeleteProduct.addEventListener('click', () => this.confirmDeleteProduct());
    }

    const cancelDeleteProduct = document.getElementById('cancelDeleteProduct');
    if (cancelDeleteProduct) {
      cancelDeleteProduct.addEventListener('click', () => this.cancelDeleteProduct());
    }

    const closeDeleteProductModal = document.getElementById('closeDeleteProductModal');
    if (closeDeleteProductModal) {
      closeDeleteProductModal.addEventListener('click', () => this.cancelDeleteProduct());
    }

    // Modal de exclusão de venda
    const confirmDeleteSale = document.getElementById('confirmDeleteSale');
    if (confirmDeleteSale) {
      confirmDeleteSale.addEventListener('click', () => this.confirmDeleteSale());
    }

    const cancelDeleteSale = document.getElementById('cancelDeleteSale');
    if (cancelDeleteSale) {
      cancelDeleteSale.addEventListener('click', () => this.cancelDeleteSale());
    }

    const closeDeleteSaleModal = document.getElementById('closeDeleteSaleModal');
    if (closeDeleteSaleModal) {
      closeDeleteSaleModal.addEventListener('click', () => this.cancelDeleteSale());
    }
  }

  // Configurar event listeners para modais de produtos
  setupProductModalEventListeners() {
    // Modal de edição de produto
    const editProductForm = document.getElementById('editProductForm');
    if (editProductForm) {
      editProductForm.addEventListener('submit', (e) => this.handleEditProductSubmit(e));
    }

    const closeEditProductModal = document.getElementById('closeEditProductModal');
    if (closeEditProductModal) {
      closeEditProductModal.addEventListener('click', () => this.cancelEditProduct());
    }

    const cancelEditProduct = document.getElementById('cancelEditProduct');
    if (cancelEditProduct) {
      cancelEditProduct.addEventListener('click', () => this.cancelEditProduct());
    }

    // Modal de exclusão de produto
    const closeDeleteProductModal = document.getElementById('closeDeleteProductModal');
    if (closeDeleteProductModal) {
      closeDeleteProductModal.addEventListener('click', () => this.cancelDeleteProduct());
    }

    const cancelDeleteProduct = document.getElementById('cancelDeleteProduct');
    if (cancelDeleteProduct) {
      cancelDeleteProduct.addEventListener('click', () => this.cancelDeleteProduct());
    }

    const confirmDeleteProduct = document.getElementById('confirmDeleteProduct');
    if (confirmDeleteProduct) {
      confirmDeleteProduct.addEventListener('click', () => this.handleDeleteProductConfirm());
    }

    console.log('GEX App: Event listeners dos modais de produtos configurados');
  }

  // Função de debug para verificar estado do banco
  async debugDatabase() {
    try {
      console.log('🔍 DEBUG: Verificando estado do banco de dados...');
      
      const users = await this.dbManager.getAllUsers();
      console.log('👥 Usuários no banco:', users.length);
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.name}) - ID: ${user.id}`);
      });
      
      const products = await this.dbManager.getAllProducts();
      console.log('📦 Produtos no banco:', products.length);
      products.forEach(product => {
        console.log(`  - ${product.name} - ID: ${product.id}`);
      });
      
      const sales = await this.dbManager.getAllSales();
      console.log('🛒 Vendas no banco:', sales.length);
      sales.forEach(sale => {
        console.log(`  - Venda ID: ${sale.id}, Produto ID: ${sale.productId}, Produto: ${sale.productName}`);
      });
      console.log('💰 Vendas no banco:', sales.length);
      
      const currentUser = localStorage.getItem('currentUser');
      console.log('👤 Usuário atual no localStorage:', currentUser ? JSON.parse(currentUser).username : 'Nenhum');
      
      return {
        users: users.length,
        products: products.length,
        sales: sales.length,
        currentUser: currentUser ? JSON.parse(currentUser).username : null
      };
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      return null;
    }
  }

  // Função de debug para testar busca de vendas por produto
  async debugSalesByProduct(productId) {
    try {
      console.log(`🔍 DEBUG: Buscando vendas para produto ID: ${productId}`);
      
      const sales = await this.dbManager.getSalesByProduct(productId);
      console.log(`📊 Vendas encontradas: ${sales.length}`);
      
      sales.forEach(sale => {
        console.log(`  - Venda ID: ${sale.id}`);
        console.log(`    Produto ID: ${sale.productId}`);
        console.log(`    Produto Nome: ${sale.productName}`);
        console.log(`    Quantidade: ${sale.quantity}`);
        console.log(`    Data: ${sale.date}`);
        console.log('---');
      });
      
      return sales;
    } catch (error) {
      console.error('❌ Erro ao buscar vendas por produto:', error);
      return [];
    }
  }

  // Função para limpar vendas órfãs (vendas que referenciam produtos inexistentes)
  async cleanupOrphanedSales() {
    try {
      console.log('🧹 Iniciando limpeza de vendas órfãs...');
      
      const allSales = await this.dbManager.getAllSales();
      const allProducts = await this.dbManager.getAllProducts();
      const productIds = new Set(allProducts.map(p => p.id));
      
      const orphanedSales = allSales.filter(sale => !productIds.has(sale.productId));
      
      console.log(`🔍 Encontradas ${orphanedSales.length} vendas órfãs`);
      
      for (const sale of orphanedSales) {
        console.log(`🗑️ Excluindo venda órfã ID: ${sale.id} (Produto: ${sale.productName})`);
        await this.dbManager.deleteSale(sale.id);
      }
      
      console.log(`✅ ${orphanedSales.length} vendas órfãs excluídas com sucesso`);
      return orphanedSales.length;
    } catch (error) {
      console.error('❌ Erro ao limpar vendas órfãs:', error);
      return 0;
    }
  }

  // Função para abrir o manual do usuário
  openManual() {
    try {
      console.log('📖 Abrindo manual do usuário...');
      
      // Abrir o manual interativo em nova aba
      const manualPath = './manual.html';
      const newWindow = window.open(manualPath, '_blank');
      
      if (!newWindow) {
        // Se não conseguir abrir em nova aba, mostrar notificação
        this.showNotification('Erro ao abrir manual. Verifique se o arquivo manual.html existe.', 'error');
        console.log('❌ Erro ao abrir manual em nova aba');
      } else {
        console.log('✅ Manual interativo aberto em nova aba');
        this.showNotification('Manual interativo aberto com sucesso!', 'success');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir manual:', error);
      this.showNotification('Erro ao abrir manual. Verifique se o arquivo manual.html existe.', 'error');
    }
  }

}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.app = new GEXApp();
    console.log('Aplicação GEX carregada com sucesso');
    
    // Adicionar funções de debug ao objeto global para facilitar testes
    window.debugDatabase = () => window.app.debugDatabase();
    window.debugSalesByProduct = (productId) => window.app.debugSalesByProduct(productId);
    window.cleanupOrphanedSales = () => window.app.cleanupOrphanedSales();
    
    console.log('🔧 Funções de debug disponíveis:');
    console.log('  - debugDatabase() - Ver estado geral do banco');
    console.log('  - debugSalesByProduct(productId) - Ver vendas de um produto');
    console.log('  - cleanupOrphanedSales() - Limpar vendas órfãs');
  } catch (error) {
    console.error('Erro ao carregar aplicação GEX:', error);
  }
});

  // Função global para compatibilidade com onclick no HTML
  window.showPage = function(pageName) {
    if (window.app) {
      window.app.showPage(pageName);
    } else {
      console.error('Aplicação não inicializada');
    }
  };

  // Expor função de debug globalmente
  window.debugDatabase = function() {
    if (window.app) {
      return window.app.debugDatabase();
    } else {
      console.error('Aplicação não inicializada');
    }
  };

