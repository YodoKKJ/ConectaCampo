// Aguardar carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
  
  // Verificar se elementos existem antes de usar
  const carrossel = document.getElementById('carrossel');
  const items = document.querySelectorAll('.ano-item');
  
  if (!carrossel || items.length === 0) {
    console.warn('Elementos do carrossel não encontrados');
    return;
  }

  // Observer para detectar item ativo no carrossel
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remover classe ativo de todos os itens
        items.forEach(item => item.classList.remove('ativo'));
        // Adicionar classe ativo ao item visível
        entry.target.classList.add('ativo');
        
        // Anunciar mudança para leitores de tela
        const instrucoes = document.getElementById('carrossel-instrucoes');
        if (instrucoes) {
          const ano = entry.target.dataset.ano;
          instrucoes.textContent = `Visualizando: ${ano === 'quiz' ? 'Quiz' : 'Ano ' + ano}`;
        }
      }
    });
  }, { 
    root: carrossel, 
    threshold: 0.5,
    rootMargin: '0px'
  });

  // Observar todos os itens
  items.forEach(item => observer.observe(item));

  // Navegação por scroll do mouse
  carrossel.addEventListener('wheel', function(e) {
    e.preventDefault();
    const scrollAmount = e.deltaY < 0 ? -window.innerWidth : window.innerWidth;
    carrossel.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });

  // Navegação por teclado
  carrossel.addEventListener('keydown', function(e) {
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        carrossel.scrollBy({
          left: -window.innerWidth,
          behavior: 'smooth'
        });
        break;
      case 'ArrowRight':
        e.preventDefault();
        carrossel.scrollBy({
          left: window.innerWidth,
          behavior: 'smooth'
        });
        break;
      case 'Home':
        e.preventDefault();
        carrossel.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        break;
      case 'End':
        e.preventDefault();
        carrossel.scrollTo({
          left: carrossel.scrollWidth,
          behavior: 'smooth'
        });
        break;
    }
  });

  // === QUIZ FUNCTIONALITY ===
  
  // Elementos do quiz
  const quizElements = {
    popup: document.getElementById('quiz-popup'),
    btnStart: document.getElementById('btnStart'),
    quizStart: document.getElementById('quiz-start'),
    quizContainer: document.getElementById('quiz-container'),
    quizEnd: document.getElementById('quiz-end'),
    fechar: document.getElementById('fechar-quiz'),
    progressText: document.getElementById('progressText'),
    progressFill: document.getElementById('progressFill'),
    progressBar: document.getElementById('progressBar'),
    pergunta: document.getElementById('pergunta'),
    opcoes: document.getElementById('opcoes'),
    btnConfirm: document.getElementById('btnConfirm'),
    btnNext: document.getElementById('btnNext'),
    pontuacaoTexto: document.getElementById('pontuacaoTexto'),
    btnShare: document.getElementById('btnShare'),
    btnRestart: document.getElementById('btnRestart'),
    abrirQuiz: document.getElementById('abrir-quiz')
  };

  // Verificar se elementos do quiz existem
  const missingElements = Object.entries(quizElements)
    .filter(([key, element]) => !element)
    .map(([key]) => key);
  
  if (missingElements.length > 0) {
    console.warn('Elementos do quiz não encontrados:', missingElements);
    return;
  }

  // Perguntas do quiz
  const perguntas = [
    { 
      pergunta: "Quando a LojaPremium foi fundada?", 
      opcoes: ["2010", "2015", "2020", "2023"], 
      correta: 2 
    },
    { 
      pergunta: "Qual é nosso principal diferencial?", 
      opcoes: ["Preço", "Atendimento", "Qualidade", "Entrega"], 
      correta: 2 
    },
    { 
      pergunta: "Em que cidade começamos?", 
      opcoes: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba"], 
      correta: 0 
    },
    { 
      pergunta: "Quantos produtos tínhamos no início?", 
      opcoes: ["10", "20", "50", "100"], 
      correta: 1 
    },
    { 
      pergunta: "Qual nosso lema?", 
      opcoes: ["Vender muito", "Inovar sempre", "Clientes em primeiro lugar", "Preço baixo"], 
      correta: 2 
    }
  ];

  // Estado do quiz
  let quizState = {
    currentQuestion: 0,
    respostas: [],
    confirmado: false,
    chart: null
  };

  // Funções utilitárias
  function showElement(element) {
    if (element) element.classList.remove('escondido');
  }

  function hideElement(element) {
    if (element) element.classList.add('escondido');
  }

  function updateProgressBar() {
    const progress = ((quizState.currentQuestion + 1) / perguntas.length) * 100;
    quizElements.progressFill.style.width = `${progress}%`;
    quizElements.progressBar.setAttribute('aria-valuenow', progress);
  }

  function resetQuizState() {
    quizState.currentQuestion = 0;
    quizState.respostas = [];
    quizState.confirmado = false;
    if (quizState.chart) {
      quizState.chart.destroy();
      quizState.chart = null;
    }
  }

  // Event Listeners
  quizElements.abrirQuiz.addEventListener('click', function() {
    showElement(quizElements.popup);
    // Focar no primeiro elemento interativo
    setTimeout(() => {
      quizElements.btnStart.focus();
    }, 100);
  });

  quizElements.fechar.addEventListener('click', function() {
    hideElement(quizElements.popup);
  });

  // Fechar popup com ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !quizElements.popup.classList.contains('escondido')) {
      hideElement(quizElements.popup);
    }
  });

  // Fechar popup clicando fora
  quizElements.popup.addEventListener('click', function(e) {
    if (e.target === quizElements.popup) {
      hideElement(quizElements.popup);
    }
  });

  quizElements.btnStart.addEventListener('click', function() {
    hideElement(quizElements.quizStart);
    showElement(quizElements.quizContainer);
    loadQuestion();
    updateProgress();
  });

  function loadQuestion() {
    quizState.confirmado = false;
    const pergunta = perguntas[quizState.currentQuestion];
    
    if (!pergunta) {
      console.error('Pergunta não encontrada:', quizState.currentQuestion);
      return;
    }

    quizElements.pergunta.textContent = pergunta.pergunta;
    quizElements.opcoes.innerHTML = '';

    // Criar botões de opção
    pergunta.opcoes.forEach((opcao, index) => {
      const button = document.createElement('button');
      button.textContent = opcao;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      button.addEventListener('click', () => selectOption(button, index));
      button.addEventListener('keydown', (e) => {
        handleOptionKeydown(e, index);
      });
      
      quizElements.opcoes.appendChild(button);
    });

    // Mostrar/esconder botões
    showElement(quizElements.btnConfirm);
    hideElement(quizElements.btnNext);
    
    // Focar na primeira opção
    setTimeout(() => {
      const firstOption = quizElements.opcoes.querySelector('button');
      if (firstOption) firstOption.focus();
    }, 100);
  }

  function handleOptionKeydown(e, currentIndex) {
    const buttons = Array.from(quizElements.opcoes.querySelectorAll('button'));
    let newIndex = currentIndex;

    switch(e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        newIndex = (currentIndex + 1) % buttons.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        selectOption(buttons[currentIndex], currentIndex);
        return;
    }

    // Atualizar foco e tabindex
    buttons.forEach((btn, idx) => {
      btn.setAttribute('tabindex', idx === newIndex ? '0' : '-1');
    });
    buttons[newIndex].focus();
  }

  function selectOption(button, index) {
    if (quizState.confirmado) return;

    // Remover seleção anterior
    Array.from(quizElements.opcoes.children).forEach(btn => {
      btn.classList.remove('selecionado');
      btn.setAttribute('aria-checked', 'false');
    });

    // Selecionar nova opção
    button.classList.add('selecionado');
    button.setAttribute('aria-checked', 'true');
    quizState.respostas[quizState.currentQuestion] = index;
  }

  quizElements.btnConfirm.addEventListener('click', function() {
    if (quizState.respostas[quizState.currentQuestion] == null) {
      alert('Por favor, selecione uma resposta antes de confirmar.');
      return;
    }

    quizState.confirmado = true;
    const respostaCorreta = perguntas[quizState.currentQuestion].correta;
    const buttons = Array.from(quizElements.opcoes.children);

    // Mostrar respostas corretas e incorretas
    buttons.forEach((button, index) => {
      button.disabled = true;
      button.classList.remove('selecionado');
      
      if (index === respostaCorreta) {
        button.classList.add('correct');
        button.setAttribute('aria-label', `${button.textContent} - Resposta correta`);
      }
      
      if (index === quizState.respostas[quizState.currentQuestion] && index !== respostaCorreta) {
        button.classList.add('wrong');
        button.setAttribute('aria-label', `${button.textContent} - Resposta incorreta`);
      }
    });

    hideElement(quizElements.btnConfirm);
    showElement(quizElements.btnNext);
    
    // Focar no botão próxima
    setTimeout(() => {
      quizElements.btnNext.focus();
    }, 100);
  });

  quizElements.btnNext.addEventListener('click', function() {
    quizState.currentQuestion++;
    
    if (quizState.currentQuestion < perguntas.length) {
      loadQuestion();
      updateProgress();
    } else {
      showResult();
    }
  });

  function updateProgress() {
    quizElements.progressText.textContent = `Pergunta ${quizState.currentQuestion + 1} de ${perguntas.length}`;
    updateProgressBar();
  }

  function showResult() {
    hideElement(quizElements.quizContainer);
    showElement(quizElements.quizEnd);

    const acertos = quizState.respostas.reduce((sum, resposta, index) => {
      return sum + (resposta === perguntas[index].correta ? 1 : 0);
    }, 0);

    const erros = perguntas.length - acertos;
    const percentual = Math.round((acertos / perguntas.length) * 100);
    
    quizElements.pontuacaoTexto.textContent = 
      `Você acertou ${acertos} de ${perguntas.length} perguntas (${percentual}%).`;

    // Criar gráfico
    createResultChart(acertos, erros);

    // Efeito de confete
    if (typeof confetti === 'function') {
      confetti({ 
        particleCount: 200, 
        spread: 80, 
        origin: { y: 0.6 } 
      });
    }

    // Focar no primeiro botão
    setTimeout(() => {
      quizElements.btnShare.focus();
    }, 100);
  }

  function createResultChart(acertos, erros) {
    const canvas = document.getElementById('graficoPizza');
    if (!canvas) {
      console.error('Canvas do gráfico não encontrado');
      createFallbackChart(acertos, erros);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Contexto 2D não disponível');
      createFallbackChart(acertos, erros);
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (quizState.chart) {
      quizState.chart.destroy();
      quizState.chart = null;
    }

    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error('Chart.js não carregado');
      createFallbackChart(acertos, erros);
      return;
    }

    try {
      // Configurar tamanho do canvas
      canvas.width = 300;
      canvas.height = 300;
      canvas.style.width = '300px';
      canvas.style.height = '300px';

      const total = acertos + erros;
      const percentualAcertos = Math.round((acertos / total) * 100);
      const percentualErros = Math.round((erros / total) * 100);

      quizState.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: [`Acertos (${percentualAcertos}%)`, `Erros (${percentualErros}%)`],
          datasets: [{
            data: [acertos, erros],
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',   // Verde para acertos
              'rgba(244, 67, 54, 0.8)'    // Vermelho para erros
            ],
            borderColor: [
              'rgba(76, 175, 80, 1)',
              'rgba(244, 67, 54, 1)'
            ],
            borderWidth: 3,
            cutout: '60%',
            hoverOffset: 8,
            hoverBorderWidth: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: { 
              display: true,
              position: 'bottom',
              labels: {
                color: '#ffffff',
                font: {
                  size: 14,
                  weight: 'bold'
                },
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              enabled: true,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#f3a444',
              borderWidth: 2,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ${value} pergunta${value !== 1 ? 's' : ''}`;
                }
              }
            }
          },
          elements: {
            arc: {
              borderWidth: 3,
              borderJoinStyle: 'round'
            }
          },
          layout: {
            padding: {
              top: 10,
              bottom: 10,
              left: 10,
              right: 10
            }
          }
        }
      });

      // Adicionar descrição para acessibilidade
      canvas.setAttribute('aria-label', 
        `Gráfico de pizza mostrando ${acertos} acertos (${percentualAcertos}%) e ${erros} erros (${percentualErros}%) no quiz`);
      
      // Adicionar texto central no gráfico
      addCenterText(ctx, acertos, total);
      
      console.log('Gráfico criado com sucesso');
      
    } catch (error) {
      console.error('Erro ao criar gráfico Chart.js:', error);
      createFallbackChart(acertos, erros);
    }
  }

  // Função para adicionar texto no centro do gráfico
  function addCenterText(ctx, acertos, total) {
    const percentual = Math.round((acertos / total) * 100);
    
    // Plugin personalizado para texto central
    Chart.register({
      id: 'centerText',
      beforeDraw: function(chart) {
        const ctx = chart.ctx;
        const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
        const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Texto principal (percentual)
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#f3a444';
        ctx.fillText(`${percentual}%`, centerX, centerY - 10);
        
        // Texto secundário
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('de acertos', centerX, centerY + 15);
        
        ctx.restore();
      }
    });
  }

  // Função fallback para quando Chart.js não funciona
  function createFallbackChart(acertos, erros) {
    const canvas = document.getElementById('graficoPizza');
    if (!canvas) return;

    const total = acertos + erros;
    const percentualAcertos = Math.round((acertos / total) * 100);
    const percentualErros = Math.round((erros / total) * 100);

    const fallbackHTML = `
      <div class="grafico-fallback" style="
        width: 300px;
        height: 300px;
        margin: 20px auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
        border-radius: 20px;
        border: 3px solid #f3a444;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      ">
        <div style="
          font-size: 48px;
          font-weight: bold;
          color: #f3a444;
          margin-bottom: 10px;
        ">${percentualAcertos}%</div>
        <div style="
          font-size: 16px;
          color: #ffffff;
          margin-bottom: 20px;
        ">de acertos</div>
        <div style="
          display: flex;
          gap: 20px;
          font-size: 14px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4caf50;
          ">
            <div style="
              width: 16px;
              height: 16px;
              background: #4caf50;
              border-radius: 50%;
            "></div>
            ${acertos} Acertos
          </div>
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: #f44336;
          ">
            <div style="
              width: 16px;
              height: 16px;
              background: #f44336;
              border-radius: 50%;
            "></div>
            ${erros} Erros
          </div>
        </div>
      </div>
    `;

    const container = canvas.parentNode;
    container.innerHTML = fallbackHTML;
    
    console.log('Gráfico fallback criado');
  }

  quizElements.btnShare.addEventListener('click', function() {
    const acertos = quizState.respostas.reduce((sum, resposta, index) => {
      return sum + (resposta === perguntas[index].correta ? 1 : 0);
    }, 0);
    
    const texto = `Eu acertei ${acertos} de ${perguntas.length} perguntas no Quiz da LojaPremium! 🎉`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto)
        .then(() => {
          alert('Resultado copiado para a área de transferência!');
        })
        .catch(err => {
          console.error('Erro ao copiar:', err);
          fallbackCopyText(texto);
        });
    } else {
      fallbackCopyText(texto);
    }
  });

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      alert('Resultado copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
      alert('Não foi possível copiar automaticamente. Texto: ' + text);
    }
    
    document.body.removeChild(textArea);
  }

  quizElements.btnRestart.addEventListener('click', function() {
    resetQuizState();
    hideElement(quizElements.quizEnd);
    showElement(quizElements.quizStart);
    quizElements.progressFill.style.width = '0%';
    quizElements.progressBar.setAttribute('aria-valuenow', '0');
    
    // Focar no botão de início
    setTimeout(() => {
      quizElements.btnStart.focus();
    }, 100);
  });

  // Inicializar primeiro item como ativo
  if (items.length > 0) {
    items[0].classList.add('ativo');
  }

  // Tratamento de erros global para o quiz
  window.addEventListener('error', function(e) {
    console.error('Erro na página:', e.error);
  });

  // Log de inicialização
  console.log('Script da página Sobre carregado com sucesso');
});

