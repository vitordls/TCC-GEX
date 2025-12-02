// Database Manager - IndexedDB
class DatabaseManager {
  constructor() {
    this.dbName = 'GEX_Dashboard';
    this.version = 4; // Incrementar versão para adicionar custos e impostos
    this.db = null;
  }

  // Inicializar o banco de dados
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Erro ao abrir o banco de dados:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Banco de dados inicializado com sucesso');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        // Criar store para produtos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
          productStore.createIndex('price', 'price', { unique: false });
          productStore.createIndex('userId', 'userId', { unique: false });
        } else if (oldVersion < 2) {
          // Adicionar índice userId se não existir
          const transaction = event.target.transaction;
          const productStore = transaction.objectStore('products');
          if (!productStore.indexNames.contains('userId')) {
            productStore.createIndex('userId', 'userId', { unique: false });
          }
        }
        
        if (oldVersion < 3) {
          // Adicionar campo de custo aos produtos existentes
          const transaction = event.target.transaction;
          const productStore = transaction.objectStore('products');
          const request = productStore.getAll();
          request.onsuccess = () => {
            const products = request.result;
            products.forEach(product => {
              if (product.cost === undefined) {
                product.cost = 0; // Valor padrão para produtos existentes
                productStore.put(product);
              }
            });
          };
        }
        
        // Criar store para custos
        if (!db.objectStoreNames.contains('costs')) {
          const costStore = db.createObjectStore('costs', { keyPath: 'id' });
          costStore.createIndex('userId', 'userId', { unique: false });
          costStore.createIndex('date', 'date', { unique: false });
          costStore.createIndex('category', 'category', { unique: false });
        }
        
        // Criar store para impostos
        if (!db.objectStoreNames.contains('taxes')) {
          const taxStore = db.createObjectStore('taxes', { keyPath: 'id' });
          taxStore.createIndex('userId', 'userId', { unique: false });
          taxStore.createIndex('date', 'date', { unique: false });
          taxStore.createIndex('type', 'type', { unique: false });
        }

        // Criar store para vendas
        if (!db.objectStoreNames.contains('sales')) {
          const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
          salesStore.createIndex('date', 'date', { unique: false });
          salesStore.createIndex('productId', 'productId', { unique: false });
          salesStore.createIndex('productName', 'productName', { unique: false });
          salesStore.createIndex('userId', 'userId', { unique: false });
        } else if (oldVersion < 2) {
          // Adicionar índice userId se não existir
          const transaction = event.target.transaction;
          const salesStore = transaction.objectStore('sales');
          if (!salesStore.indexNames.contains('userId')) {
            salesStore.createIndex('userId', 'userId', { unique: false });
          }
        }

        // Criar store para usuários
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Criar store para configurações
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('Estrutura do banco de dados criada');
      };
    });
  }

  // Operações genéricas para qualquer store
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.get(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Operações específicas para produtos
  async addProduct(product, userId) {
    console.log('📦 DatabaseManager: Adicionando produto:', product, 'para usuário:', userId);
    const productData = {
      id: product.id || this.generateId(),
      name: product.name,
      price: parseFloat(product.price),
      stock: parseInt(product.stock),
      cost: parseFloat(product.cost || 0),
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('📦 DatabaseManager: Dados do produto processados:', productData);
    const result = await this.add('products', productData);
    console.log('✅ DatabaseManager: Produto adicionado com sucesso:', result);
    return result;
  }

  async getProduct(id) {
    return this.get('products', id);
  }

  async getAllProducts() {
    return this.getAll('products');
  }

  async getProductsByUser(userId) {
    return new Promise((resolve, reject) => {
      console.log('Buscando produtos para userId:', userId);
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        console.log('Produtos encontrados:', request.result);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Erro ao buscar produtos:', request.error);
        reject(request.error);
      };
    });
  }

  async updateProduct(product) {
    const productData = {
      ...product,
      updatedAt: new Date().toISOString()
    };
    return this.update('products', productData);
  }

  // Atualizar estoque de um produto
  async updateProductStock(productId, quantityChange) {
    try {
      const product = await this.get('products', productId);
      if (!product) {
        throw new Error('Produto não encontrado');
      }

      const newStock = product.stock + quantityChange;
      if (newStock < 0) {
        throw new Error('Estoque insuficiente');
      }

      const updatedProduct = {
        ...product,
        stock: newStock,
        updatedAt: new Date().toISOString()
      };

      return this.update('products', updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw error;
    }
  }

  async deleteProduct(id) {
    return this.delete('products', id);
  }

  // Operações específicas para vendas
  async addSale(sale, userId) {
    console.log('💰 DatabaseManager: Adicionando venda:', sale, 'para usuário:', userId);
    // Combinar data e horário
    const saleDateTime = new Date(`${sale.date}T${sale.time}`);
    
    const saleData = {
      id: sale.id || this.generateId(),
      date: saleDateTime.toISOString(),
      dateOnly: sale.date, // Data sem horário para agrupamento
      time: sale.time, // Horário separado
      productId: sale.productId,
      productName: sale.productName,
      quantity: parseInt(sale.quantity),
      price: parseFloat(sale.price),
      amount: parseFloat(sale.amount),
      cost: sale.cost || 0,
      totalCost: sale.totalCost || 0,
      profit: sale.profit || 0,
      margin: sale.margin || 0,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    console.log('💰 DatabaseManager: Dados da venda processados:', saleData);
    const result = await this.add('sales', saleData);
    console.log('✅ DatabaseManager: Venda adicionada com sucesso:', result);
    return result;
  }

  async getSale(id) {
    return this.get('sales', id);
  }

  // Operações específicas para custos
  async addCost(cost, userId) {
    const costData = {
      id: cost.id || this.generateId(),
      description: cost.description,
      category: cost.category,
      value: parseFloat(cost.value),
      date: cost.date instanceof Date ? cost.date.toISOString() : cost.date,
      paid: cost.paid || false,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    return this.add('costs', costData);
  }

  async getCostsByUser(userId) {
    console.log('🔍 Database: Buscando custos para usuário:', userId);
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['costs'], 'readonly');
      const store = transaction.objectStore('costs');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allCosts = request.result;
        const userCosts = allCosts.filter(cost => cost.userId === userId);
        console.log('🔍 Database: Custos encontrados:', userCosts.length, 'de', allCosts.length, 'total');
        resolve(userCosts);
      };
      
      request.onerror = () => {
        console.error('❌ Database: Erro ao buscar custos:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteCost(id) {
    return this.delete('costs', id);
  }

  // Operações específicas para impostos
  async addTax(tax, userId) {
    const taxData = {
      id: tax.id || this.generateId(),
      description: tax.description,
      type: tax.type,
      value: parseFloat(tax.value),
      date: tax.date instanceof Date ? tax.date.toISOString() : tax.date,
      paid: tax.paid || false,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    return this.add('taxes', taxData);
  }

  async getTaxesByUser(userId) {
    console.log('🔍 Database: Buscando impostos para usuário:', userId);
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['taxes'], 'readonly');
      const store = transaction.objectStore('taxes');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allTaxes = request.result;
        const userTaxes = allTaxes.filter(tax => tax.userId === userId);
        console.log('🔍 Database: Impostos encontrados:', userTaxes.length, 'de', allTaxes.length, 'total');
        resolve(userTaxes);
      };
      
      request.onerror = () => {
        console.error('❌ Database: Erro ao buscar impostos:', request.error);
        reject(request.error);
      };
    });
  }

  async deleteTax(id) {
    return this.delete('taxes', id);
  }

  async getAllSales() {
    return this.getAll('sales');
  }

  async getSalesByUser(userId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSalesByDateRange(startDate, endDate) {
    const allSales = await this.getAllSales();
    return allSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  async getSalesByProduct(productId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sales'], 'readonly');
      const store = transaction.objectStore('sales');
      const index = store.index('productId');
      const request = index.getAll(productId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSale(id) {
    return this.delete('sales', id);
  }

  // Operações específicas para usuários
  async addUser(user) {
    console.log('👤 DatabaseManager: Adicionando usuário:', user);
    const userData = {
      id: user.id || this.generateId(),
      name: user.name,
      email: user.email,
      username: user.username,
      password: user.password, // Em produção, isso deveria ser hash
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('👤 DatabaseManager: Dados do usuário processados:', userData);
    const result = await this.add('users', userData);
    console.log('✅ DatabaseManager: Usuário adicionado com sucesso:', result);
    return result;
  }

  async getUser(id) {
    return this.get('users', id);
  }

  async getUserByUsername(username) {
    console.log('🔍 DatabaseManager: Buscando usuário por username:', username);
    const result = await this.getByIndex('users', 'username', username);
    console.log('👤 DatabaseManager: Resultado da busca:', result);
    return result;
  }

  async getUserByEmail(email) {
    return this.getByIndex('users', 'email', email);
  }

  async getAllUsers() {
    return this.getAll('users');
  }

  async updateUser(user) {
    const userData = {
      ...user,
      updatedAt: new Date().toISOString()
    };
    return this.update('users', userData);
  }

  async deleteUser(id) {
    return this.delete('users', id);
  }

  // Operações para configurações
  async setSetting(key, value) {
    const settingData = {
      key: key,
      value: value,
      updatedAt: new Date().toISOString()
    };
    return this.update('settings', settingData);
  }

  async getSetting(key) {
    const setting = await this.get('settings', key);
    return setting ? setting.value : null;
  }

  // Utilitários
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Migração de dados do localStorage para IndexedDB
  async migrateFromLocalStorage() {
    try {
      // Verificar se já existem usuários no IndexedDB
      const existingUsers = await this.getAllUsers();
      if (existingUsers.length > 0) {
        console.log('✅ Usuários já existem no IndexedDB, pulando migração');
        return;
      }

      // Migrar usuários do localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      if (users.length > 0) {
        console.log('🔄 Migrando usuários do localStorage...');
        for (const user of users) {
          try {
            await this.addUser(user);
          } catch (error) {
            console.log('Usuário já existe ou erro ao migrar:', user.username);
          }
        }

        // Limpar dados do localStorage após migração bem-sucedida
        localStorage.removeItem('users');
        console.log('✅ Migração do localStorage concluída');
      } else {
        console.log('ℹ️ Nenhum usuário encontrado no localStorage');
      }
    } catch (error) {
      console.error('Erro na migração:', error);
    }
  }

  // Inicializar dados padrão
  async initializeDefaultData() {
    try {
      console.log('🔄 Verificando se dados de demonstração já existem...');
      
      // Verificar se já existem usuários
      const existingUsers = await this.getAllUsers();
      if (existingUsers.length > 0) {
        console.log('✅ Dados já existem, pulando criação de dados padrão');
        return;
      }
      
      console.log('🔄 Iniciando criação de dados de demonstração...');
      
      // Criar usuário admin
      console.log('👤 Criando usuário admin...');
      const adminUser = await this.addUser({
        name: 'Administrador',
        email: 'admin@gex.com',
        username: 'admin',
        password: 'admin'
      });
      console.log('✅ Usuário admin criado:', adminUser.id);

      // Criar produtos de demonstração
      console.log('📦 Criando produtos...');
      const defaultProducts = [
        // Smartphones e Tablets
        { name: 'iPhone 15 Pro Max 256GB', price: 8999.90, stock: 8, cost: 6999.90 },
        { name: 'Samsung Galaxy S24 Ultra 512GB', price: 7999.90, stock: 12, cost: 5999.90 },
        { name: 'iPad Pro 12.9" M2 256GB', price: 8999.90, stock: 6, cost: 6999.90 },
        { name: 'iPhone 14 128GB', price: 4999.90, stock: 15, cost: 3999.90 },
        { name: 'Samsung Galaxy A54 128GB', price: 1999.90, stock: 25, cost: 1499.90 },
        
        // Notebooks e Computadores
        { name: 'MacBook Pro 14" M3 512GB', price: 18999.90, stock: 4, cost: 14999.90 },
        { name: 'Dell XPS 13 Plus i7 16GB', price: 12999.90, stock: 6, cost: 9999.90 },
        { name: 'Lenovo ThinkPad X1 Carbon', price: 8999.90, stock: 8, cost: 6999.90 },
        { name: 'ASUS ROG Strix G15 Gaming', price: 6999.90, stock: 5, cost: 5499.90 },
        { name: 'HP Pavilion 15 i5 8GB', price: 2999.90, stock: 12, cost: 2299.90 },
        
        // Acessórios e Periféricos
        { name: 'AirPods Pro 2ª Geração', price: 1999.90, stock: 20, cost: 1499.90 },
        { name: 'Sony WH-1000XM5 Headphone', price: 1799.90, stock: 15, cost: 1299.90 },
        { name: 'Magic Mouse 2 Apple', price: 599.90, stock: 30, cost: 399.90 },
        { name: 'Magic Keyboard Apple', price: 999.90, stock: 25, cost: 699.90 },
        { name: 'Logitech MX Master 3S', price: 499.90, stock: 35, cost: 349.90 },
        
        // Monitores e Displays
        { name: 'Monitor Dell UltraSharp 27" 4K', price: 2999.90, stock: 8, cost: 2299.90 },
        { name: 'Monitor Samsung Odyssey G9 49"', price: 8999.90, stock: 3, cost: 6999.90 },
        { name: 'Monitor LG UltraGear 24" 144Hz', price: 1299.90, stock: 15, cost: 999.90 },
        { name: 'Apple Studio Display 27"', price: 11999.90, stock: 2, cost: 8999.90 },
        
        // Câmeras e Fotografia
        { name: 'Canon EOS R6 Mark II', price: 18999.90, stock: 3, cost: 14999.90 },
        { name: 'Sony A7 IV Mirrorless', price: 15999.90, stock: 4, cost: 11999.90 },
        { name: 'GoPro Hero 12 Black', price: 1999.90, stock: 18, cost: 1499.90 },
        { name: 'DJI Mini 3 Pro Drone', price: 3999.90, stock: 6, cost: 2999.90 },
        
        // Gaming e Entretenimento
        { name: 'PlayStation 5 Console', price: 4499.90, stock: 8, cost: 3499.90 },
        { name: 'Xbox Series X Console', price: 3999.90, stock: 10, cost: 2999.90 },
        { name: 'Nintendo Switch OLED', price: 2499.90, stock: 15, cost: 1999.90 },
        { name: 'Steam Deck 512GB', price: 3999.90, stock: 5, cost: 2999.90 },
        
        // Acessórios de Escritório
        { name: 'Impressora HP LaserJet Pro', price: 899.90, stock: 20, cost: 599.90 },
        { name: 'Scanner Canon CanoScan', price: 1299.90, stock: 12, cost: 999.90 },
        { name: 'Roteador Wi-Fi 6E ASUS', price: 899.90, stock: 25, cost: 699.90 },
        { name: 'Hub USB-C Anker 7-portas', price: 299.90, stock: 40, cost: 199.90 }
      ];

      for (const product of defaultProducts) {
        await this.addProduct(product, adminUser.id);
      }
      console.log('✅ Produtos criados:', defaultProducts.length);

      // Criar vendas de demonstração
      console.log('💰 Criando vendas...');
      const allProducts = await this.getProductsByUser(adminUser.id);
      console.log('📊 Produtos disponíveis para vendas:', allProducts.length);
      
      if (allProducts.length > 0) {
        const demoSales = this.generateDemoSales(allProducts, adminUser.id);
        
        for (const sale of demoSales) {
          await this.addSale(sale, adminUser.id);
        }
        console.log('✅ Vendas criadas:', demoSales.length);
      } else {
        console.log('⚠️ Nenhum produto disponível para criar vendas');
      }

      // Verificar dados finais
      const finalProducts = await this.getProductsByUser(adminUser.id);
      const finalSales = await this.getSalesByUser(adminUser.id);
      
      console.log('🎉 Dados de demonstração prontos!');
      console.log('📊 Resumo final:', {
        produtos: finalProducts.length,
        vendas: finalSales.length,
        usuario: adminUser.username
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar dados padrão:', error);
      throw error;
    }
  }

  // Limpar todos os dados
  async clearAllData() {
    try {
      console.log('🧹 Limpando dados existentes...');
      const stores = ['users', 'products', 'sales', 'costs', 'taxes'];
      
      for (const store of stores) {
        try {
          const transaction = this.db.transaction([store], 'readwrite');
          const objectStore = transaction.objectStore(store);
          
          await new Promise((resolve, reject) => {
            const request = objectStore.clear();
            request.onsuccess = () => {
              console.log(`✅ Store ${store} limpa`);
              resolve();
            };
            request.onerror = () => {
              console.log(`⚠️ Store ${store} não existe ou erro:`, request.error);
              resolve(); // Continuar mesmo se a store não existir
            };
          });
        } catch (error) {
          console.log(`⚠️ Erro ao limpar store ${store}:`, error.message);
          // Continuar mesmo com erro
        }
      }
      
      // Limpar também o localStorage
      localStorage.removeItem('currentUser');
      console.log('✅ Limpeza concluída');
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  }

  // Função para resetar dados (apenas para desenvolvimento)
  async resetDatabase() {
    console.log('🔄 Resetando banco de dados...');
    await this.clearAllData();
    await this.initializeDefaultData();
    console.log('✅ Banco de dados resetado');
  }

  // Gerar vendas de demonstração
  generateDemoSales(products, userId) {
    const sales = [];
    const today = new Date();
    
    console.log('🎲 Gerando vendas de demonstração...');
    console.log('📅 Período: últimos 45 dias');
    console.log('🛍️ Produtos disponíveis:', products.length);
    console.log('👤 User ID:', userId);
    
    if (products.length === 0) {
      console.error('❌ Nenhum produto disponível para gerar vendas!');
      return sales;
    }
    
    // Categorizar produtos por popularidade
    const popularProducts = products.filter(p => p.price > 5000); // Produtos caros
    const midRangeProducts = products.filter(p => p.price >= 1000 && p.price <= 5000);
    const budgetProducts = products.filter(p => p.price < 1000);
    
    // Gerar vendas dos últimos 45 dias
    for (let i = 0; i < 45; i++) {
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - i);
      
      // Vendas por dia baseadas no dia da semana
      const dayOfWeek = saleDate.getDay();
      let salesPerDay;
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Fim de semana
        salesPerDay = Math.floor(Math.random() * 6) + 3; // 3-8 vendas
      } else if (dayOfWeek === 1) { // Segunda-feira (mais vendas)
        salesPerDay = Math.floor(Math.random() * 8) + 12; // 12-19 vendas
      } else { // Dias úteis
        salesPerDay = Math.floor(Math.random() * 10) + 8; // 8-17 vendas
      }
      
      for (let j = 0; j < salesPerDay; j++) {
        let product;
        let quantity;
        
        // Escolher produto baseado na popularidade e preço
        const rand = Math.random();
        if (rand < 0.1) { // 10% produtos caros
          product = popularProducts[Math.floor(Math.random() * popularProducts.length)];
          quantity = Math.floor(Math.random() * 2) + 1; // 1-2 unidades
        } else if (rand < 0.4) { // 30% produtos médios
          product = midRangeProducts[Math.floor(Math.random() * midRangeProducts.length)];
          quantity = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
        } else { // 60% produtos baratos
          product = budgetProducts[Math.floor(Math.random() * budgetProducts.length)];
          quantity = Math.floor(Math.random() * 5) + 1; // 1-5 unidades
        }
        
        const price = product.price;
        const amount = price * quantity;
        
        // Horário baseado no tipo de produto
        let hour, minute;
        if (product.name.includes('Gaming') || product.name.includes('PlayStation') || product.name.includes('Xbox')) {
          // Produtos de gaming vendem mais à noite
          hour = Math.floor(Math.random() * 6) + 18; // 18h-23h
        } else if (product.name.includes('iPhone') || product.name.includes('iPad') || product.name.includes('MacBook')) {
          // Produtos Apple vendem mais durante o dia
          hour = Math.floor(Math.random() * 8) + 9; // 9h-16h
        } else {
          // Produtos gerais
          hour = Math.floor(Math.random() * 12) + 8; // 8h-19h
        }
        
        minute = Math.floor(Math.random() * 60);
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        const sale = {
          date: saleDate.toISOString().split('T')[0],
          time: time,
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          price: price,
          amount: amount
        };
        
        sales.push(sale);
      }
    }
    
    // Adicionar vendas de hoje (mais realistas)
    const todaySales = Math.floor(Math.random() * 8) + 5; // 5-12 vendas hoje
    for (let k = 0; k < todaySales; k++) {
      let product;
      let quantity;
      
      const rand = Math.random();
      if (rand < 0.15) { // 15% produtos caros hoje
        product = popularProducts[Math.floor(Math.random() * popularProducts.length)];
        quantity = Math.floor(Math.random() * 2) + 1;
      } else if (rand < 0.45) { // 30% produtos médios hoje
        product = midRangeProducts[Math.floor(Math.random() * midRangeProducts.length)];
        quantity = Math.floor(Math.random() * 3) + 1;
      } else { // 55% produtos baratos hoje
        product = budgetProducts[Math.floor(Math.random() * budgetProducts.length)];
        quantity = Math.floor(Math.random() * 4) + 1;
      }
      
      const price = product.price;
      const amount = price * quantity;
      
      const hour = Math.floor(Math.random() * 12) + 8; // 8h-19h
      const minute = Math.floor(Math.random() * 60);
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const sale = {
        date: today.toISOString().split('T')[0],
        time: time,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        price: price,
        amount: amount
      };
      
      sales.push(sale);
    }
    
    // Ordenar vendas por data e hora
    sales.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB - dateA; // Mais recentes primeiro
    });
    
    console.log('💰 Total de vendas geradas:', sales.length);
    console.log('📊 Vendas por categoria:');
    console.log('  - Produtos caros (>R$5k):', sales.filter(s => s.price > 5000).length);
    console.log('  - Produtos médios (R$1k-5k):', sales.filter(s => s.price >= 1000 && s.price <= 5000).length);
    console.log('  - Produtos baratos (<R$1k):', sales.filter(s => s.price < 1000).length);
    console.log('📊 Primeiras 3 vendas:', sales.slice(0, 3));
    console.log('📊 Últimas 3 vendas:', sales.slice(-3));
    
    return sales;
  }

  // Fechar conexão com o banco
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instância global do gerenciador de banco
const dbManager = new DatabaseManager();

// Exportar para uso global
window.dbManager = dbManager;
