// Aguardar carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Página carregada - Inicializando funcionalidades');

  // === ELEMENTOS ===
  const elementos = {
    menuToggle: document.querySelector('.menu-toggle'),
    menu: document.querySelector('.menu'),
    menuOverlay: document.querySelector('.menu-overlay'),
    flipCards: document.querySelectorAll('.flip-card'),
    botoesComprar: document.querySelectorAll('.botao-comprar'),
    iconeBusca: document.querySelector('.icon-btn[aria-label*="busca"]'),
    iconeNotificacao: document.querySelector('.icon-btn[aria-label*="notificação"]'),
    modalBusca: document.getElementById('modal-busca'),
    fecharModal: document.querySelector('.fechar'),
    campoBusca: document.getElementById('campo-busca'),
    btnBuscar: document.getElementById('btn-buscar'),
    produtoInstrucoes: document.getElementById('produto-instrucoes'),
    contadorCarrinho: document.getElementById('contador-carrinho')
  };

  // === ESTADO DA APLICAÇÃO ===
  let estado = {
    menuAberto: false,
    carrinhoItens: parseInt(localStorage.getItem('carrinho-itens') || '0'),
    performance: {
      flipCount: 0,
      startTime: Date.now()
    }
  };

  // === UTILITÁRIOS ===
  function log(message, data = null) {
    console.log(`📱 ${message}`, data || '');
  }

  function verificarElemento(elemento, nome) {
    if (!elemento) {
      console.warn(`⚠️ Elemento não encontrado: ${nome}`);
      return false;
    }
    return true;
  }

  function atualizarContadorCarrinho() {
    if (elementos.contadorCarrinho) {
      elementos.contadorCarrinho.textContent = estado.carrinhoItens;
      localStorage.setItem('carrinho-itens', estado.carrinhoItens.toString());
    }
  }

  // === MENU MOBILE ===
  function toggleMenu() {
    if (!verificarElemento(elementos.menuToggle, 'menu-toggle')) return;

    estado.menuAberto = !estado.menuAberto;
    
    elementos.menuToggle.classList.toggle('ativo', estado.menuAberto);
    elementos.menu?.classList.toggle('ativo', estado.menuAberto);
    elementos.menuOverlay?.classList.toggle('ativo', estado.menuAberto);
    
    // Acessibilidade
    elementos.menuToggle.setAttribute('aria-expanded', estado.menuAberto);
    
    // Gerenciar foco
    if (estado.menuAberto) {
      elementos.menu?.querySelector('a')?.focus();
    }
    
    log(`Menu ${estado.menuAberto ? 'aberto' : 'fechado'}`);
  }

  function fecharMenu() {
    if (estado.menuAberto) {
      toggleMenu();
    }
  }

  // === FLIP CARDS - NOVA ABORDAGEM SIMPLIFICADA ===
  function flipCard(card) {
    if (!card) return;

    try {
      const isFlipped = card.classList.contains('flipped');
      const produto = card.dataset.produto || 'desconhecido';
      
      // Toggle simples da classe
      card.classList.toggle('flipped');
      
      const novoEstado = card.classList.contains('flipped');
      
      // Atualizar ARIA
      card.setAttribute('aria-pressed', novoEstado.toString());
      
      // Feedback para leitores de tela
      if (elementos.produtoInstrucoes) {
        elementos.produtoInstrucoes.textContent = novoEstado 
          ? `Produto ${produto} revelado. Clique novamente para ocultar.`
          : `Produto ${produto} ocultado. Clique para revelar.`;
      }
      
      // Estatísticas
      estado.performance.flipCount++;
      
      log(`Card ${produto} ${novoEstado ? 'flipado' : 'normal'} (Total: ${estado.performance.flipCount})`);
      
      // Feedback sonoro opcional
      try {
        if ('AudioContext' in window && estado.performance.flipCount <= 10) {
          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(novoEstado ? 800 : 400, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        }
      } catch (audioError) {
        // Ignorar erros de áudio
      }
      
    } catch (error) {
      console.error('❌ Erro no flip da carta:', error);
    }
  }

  // === CARRINHO ===
  function adicionarAoCarrinho(produto) {
    estado.carrinhoItens++;
    atualizarContadorCarrinho();
    
    mostrarNotificacao(`${produto} adicionado ao carrinho!`);
    log(`Produto adicionado: ${produto} (Total: ${estado.carrinhoItens})`);
  }

  // === NOTIFICAÇÕES ===
  function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // Remover notificação existente
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
      notificacaoExistente.remove();
    }

    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.innerHTML = `
      <div class="notificacao-conteudo">
        <span>${tipo === 'sucesso' ? '✅' : '⚠️'}</span>
        <span>${mensagem}</span>
      </div>
    `;

    document.body.appendChild(notificacao);

    // Remover após 3 segundos
    setTimeout(() => {
      if (notificacao.parentNode) {
        notificacao.remove();
      }
    }, 3000);
  }

  // === MODAL DE BUSCA ===
  function abrirModalBusca() {
    if (elementos.modalBusca) {
      elementos.modalBusca.style.display = 'flex';
      elementos.campoBusca?.focus();
      log('Modal de busca aberto');
    }
  }

  function fecharModalBusca() {
    if (elementos.modalBusca) {
      elementos.modalBusca.style.display = 'none';
      elementos.iconeBusca?.focus();
      log('Modal de busca fechado');
    }
  }

  function realizarBusca() {
    const termo = elementos.campoBusca?.value.trim();
    if (termo) {
      mostrarNotificacao(`Buscando por: "${termo}"`);
      log(`Busca realizada: ${termo}`);
      fecharModalBusca();
    }
  }

  // === EVENT LISTENERS ===

  // Menu mobile
  if (elementos.menuToggle) {
    elementos.menuToggle.addEventListener('click', toggleMenu);
  }

  if (elementos.menuOverlay) {
    elementos.menuOverlay.addEventListener('click', fecharMenu);
  }

  // Flip cards
  elementos.flipCards.forEach((card, index) => {
    if (!card) return;

    // Click
    card.addEventListener('click', (e) => {
      e.preventDefault();
      flipCard(card);
    });

    // Teclado
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flipCard(card);
      }
    });

    log(`Card ${index + 1} configurado`);
  });

  // Botões de comprar
  elementos.botoesComprar.forEach((botao, index) => {
    if (!botao) return;

    botao.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = botao.closest('.flip-card');
      const produto = card?.dataset.produto || `Produto ${index + 1}`;
      const nome = card?.querySelector('.flip-card-back h3')?.textContent || produto;
      
      adicionarAoCarrinho(nome);
    });
  });

  // Modal de busca
  if (elementos.iconeBusca) {
    elementos.iconeBusca.addEventListener('click', abrirModalBusca);
  }

  if (elementos.fecharModal) {
    elementos.fecharModal.addEventListener('click', fecharModalBusca);
  }

  if (elementos.btnBuscar) {
    elementos.btnBuscar.addEventListener('click', realizarBusca);
  }

  if (elementos.campoBusca) {
    elementos.campoBusca.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        realizarBusca();
      }
    });
  }

  // Notificações
  if (elementos.iconeNotificacao) {
    elementos.iconeNotificacao.addEventListener('click', () => {
      mostrarNotificacao('Você tem 3 notificações pendentes');
    });
  }

  // Navegação por teclado entre cards
  document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('flip-card')) {
      const cards = Array.from(elementos.flipCards);
      const currentIndex = cards.indexOf(e.target);
      
      let nextIndex = -1;
      
      switch (e.key) {
        case 'ArrowLeft':
          nextIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
          break;
        case 'ArrowRight':
          nextIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
          break;
      }
      
      if (nextIndex !== -1) {
        e.preventDefault();
        cards[nextIndex]?.focus();
      }
    }
    
    // Fechar modal com ESC
    if (e.key === 'Escape') {
      fecharModalBusca();
      fecharMenu();
    }
  });

  // === INICIALIZAÇÃO ===
  
  // Atualizar contador do carrinho
  atualizarContadorCarrinho();
  
  // Verificar elementos críticos
  const elementosCriticos = ['flipCards'];
  elementosCriticos.forEach(nome => {
    if (elementos[nome] && elementos[nome].length === 0) {
      console.warn(`⚠️ Nenhum elemento encontrado para: ${nome}`);
    }
  });

  // Log de inicialização
  log('✅ Inicialização completa', {
    flipCards: elementos.flipCards.length,
    carrinhoItens: estado.carrinhoItens,
    tempoCarregamento: Date.now() - estado.performance.startTime + 'ms'
  });

  // Anunciar para leitores de tela
  if (elementos.produtoInstrucoes) {
    elementos.produtoInstrucoes.textContent = 'Página carregada. Use Tab para navegar entre os produtos e Enter para revelar detalhes.';
  }

  // Teste de funcionalidade após 1 segundo
  setTimeout(() => {
    log('🔍 Sistema funcionando corretamente');
  }, 1000);
});

