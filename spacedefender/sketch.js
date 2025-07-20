// Variáveis de estado do jogo
let estadoJogo = 0;
let jogador;
let listaObstaculos = [];
let listaTiros = [];
let qtdVidas = 3;
let tempoRestante = 120;
let tempoMaximo = 180;
let tirosDisponiveis = 15;
let meteorosAtingidos = 0;
let bestTime = 0;
let novoRecorde = false;
let recordeAnimacao = 0;

// Variáveis para recursos
let naveImg;
let somTiro;
let somExplosao;
let somColisao;
let somClique;
let somMusicaMenu;
let somMusicaJogo;

// Variáveis para controle de carregamento
let recursosCarregados = false;
let progressoCarregamento = 0;
const totalRecursos = 7; // Imagem + 6 sons

// Arrays para estrelas móveis
let estrelasMenu = [];
let estrelasJogo = [];

// Debug: mostrar hitbox
let mostrarHitbox = false;

// Estados dos botões
let botaoJogarHover = false;
let botaoInstrucoesHover = false;
let botaoCreditosHover = false;
let botaoVoltarHover = false;
let botaoVoltarJogoHover = false;
let botaoVoltarGameOverHover = false; // Novo estado para botão de Game Over

// Efeitos de partículas para botões
let particulasBotoes = [];

function preload() {
  // Carrega recursos com callback de progresso
  naveImg = loadImage('./nave.png', () => atualizarProgresso());
  somTiro = loadSound('./tiro.mp3', () => atualizarProgresso());
  somExplosao = loadSound('./explosao.mp3', () => atualizarProgresso());
  somColisao = loadSound('./colisao.mp3', () => atualizarProgresso());
  somClique = loadSound('./clique.mp3', () => atualizarProgresso());
  somMusicaMenu = loadSound('./universe-space-sounds-3595.mp3', () => atualizarProgresso());
  somMusicaJogo = loadSound('./universe-space-sounds-3595.mp3', () => atualizarProgresso());
}

function setup() {
  createCanvas(900, 800);
  textAlign(CENTER, CENTER);
  textFont('monospace');
  textSize(30);
  setInterval(atualizarContadorTempo, 1000);
  
  // Carregar melhor tempo do localStorage
  bestTime = localStorage.getItem('spaceDefenderBestTime') || 0;
  
  // Inicializa estrelas móveis para menu
  for (let i = 0; i < 200; i++) {
    estrelasMenu.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      speed: random(0.2, 0.5),
      alpha: random(100, 200)
    });
  }
  
  // Inicializa estrelas móveis para jogo
  for (let i = 0; i < 300; i++) {
    estrelasJogo.push({
      x: random(width),
      y: random(height),
      size: random(1, 2),
      speed: random(0.5, 1.5),
      alpha: random(150, 255)
    });
  }
  
  // Configura sons
  if (somTiro) somTiro.setVolume(0.3);
  if (somExplosao) somExplosao.setVolume(0.5);
  if (somColisao) somColisao.setVolume(0.6);
  if (somClique) somClique.setVolume(0.4);
  if (somMusicaMenu) somMusicaMenu.setVolume(0.3);
  if (somMusicaJogo) somMusicaJogo.setVolume(0.4);
  
  // Inicia música do menu
  if (somMusicaMenu && !somMusicaMenu.isPlaying()) {
    somMusicaMenu.loop();
  }
}

function atualizarProgresso() {
  progressoCarregamento++;
  if (progressoCarregamento === totalRecursos) {
    recursosCarregados = true;
  }
}

function draw() {
  // Tela de carregamento
  if (!recursosCarregados) {
    mostrarTelaCarregamento();
    return;
  }
  
  clear();
  switch (estadoJogo) {
    case 0: 
      atualizarHoverBotoesMenu();
      mostrarMenuPrincipal(); 
      break;
    case 1: 
      executarFaseDesvio(); 
      break;
    case 2: 
      mostrarTelaInstrucoes(); 
      break;
    case 3: 
      mostrarTelaCreditos(); 
      break;
    case 4: // Tela de Game Over
      mostrarTelaGameOver();
      break;
    case 5: // Tela de Missão Concluída
      mostrarTelaMissaoCompleta();
      break;
  }
  
  // Atualizar estado dos botões voltar
  if (estadoJogo === 2 || estadoJogo === 3) {
    botaoVoltarHover = (dist(mouseX, mouseY, 90, 50) < 40);
  }
  
  // Tecla 'H' para alternar hitbox
  if (keyIsPressed && key === 'h') {
    mostrarHitbox = !mostrarHitbox;
  }
  
  // Tecla 'M' para alternar música
  if (keyIsPressed && key === 'm') {
    if (estadoJogo === 0 && somMusicaMenu.isPlaying()) {
      somMusicaMenu.pause();
    } else if (estadoJogo === 0) {
      somMusicaMenu.play();
    } else if (estadoJogo === 1 && somMusicaJogo.isPlaying()) {
      somMusicaJogo.pause();
    } else if (estadoJogo === 1) {
      somMusicaJogo.play();
    }
  }
  
  // Atualizar partículas dos botões
  atualizarParticulasBotoes();
}

function mostrarTelaCarregamento() {
  background(10, 15, 30);
  
  // Texto de carregamento
  fill(180, 220, 255);
  textSize(28);
  text("CARREGANDO RECURSOS...", width/2, height/2 - 50);
  
  // Barra de progresso
  let w = map(progressoCarregamento, 0, totalRecursos, 0, 600);
  noStroke();
  fill(50, 100, 180);
  rect(width/2 - 300, height/2, 600, 30, 15);
  fill(80, 180, 255);
  rect(width/2 - 300, height/2, w, 30, 15);
  
  // Texto de porcentagem
  let porcentagem = floor((progressoCarregamento / totalRecursos) * 100);
  fill(255);
  textSize(24);
  text(porcentagem + "%", width/2, height/2 + 80);
  
  // Dicas de otimização
  textSize(16);
  fill(150, 180, 220);
  text("Se o carregamento estiver lento, verifique:\n- Sua conexão com a internet\n- Tamanho dos arquivos de áudio", width/2, height/2 + 150);
}

function atualizarHoverBotoesMenu() {
  const yBase = 300; // Posição inicial mais baixa
  const espacamento = 150; // 50% mais espaço entre botões
  
  botaoJogarHover = (dist(mouseX, mouseY, width/2, yBase) < 50);
  botaoInstrucoesHover = (dist(mouseX, mouseY, width/2, yBase + espacamento) < 50);
  botaoCreditosHover = (dist(mouseX, mouseY, width/2, yBase + espacamento * 2) < 50);
}

function criarParticulaBotao(x, y, cor) {
  particulasBotoes.push({
    x: x + random(-60, 60),
    y: y + random(-40, 40),
    size: random(2, 6),
    speedX: random(-1, 1),
    speedY: random(-1, 1),
    alpha: 255,
    color: cor
  });
}

function atualizarParticulasBotoes() {
  for (let i = particulasBotoes.length - 1; i >= 0; i--) {
    let p = particulasBotoes[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.alpha -= 4;
    
    if (p.alpha <= 0) {
      particulasBotoes.splice(i, 1);
    } else {
      fill(red(p.color), green(p.color), blue(p.color), p.alpha);
      noStroke();
      ellipse(p.x, p.y, p.size);
    }
  }
}

function mostrarMenuPrincipal() {
  // Fundo com estrelas móveis
  desenharFundoEstrelas(estrelasMenu, 100, 150, 255);
  
  // Título estilizado com efeito de brilho
  drawingContext.shadowBlur = 20;
  drawingContext.shadowColor = color(255, 215, 0);
  fill(255, 215, 0);
  textSize(60);
  textStyle(BOLD);
  text("★ SPACE DEFENDER ★", width / 2, 120);
  textStyle(NORMAL);
  drawingContext.shadowBlur = 0;
  
  // POSIÇÕES AJUSTADAS (mais espaço entre botões)
  const yBase = 300; // Posição inicial mais baixa
  const espacamento = 150; // 50% mais espaço entre botões

  // Títulos acima dos botões (reposicionados)
  fill(180, 220, 255);
  textSize(26);
  text("Comece sua missão", width/2, yBase - 70);
  text("Aprenda a jogar", width/2, yBase + espacamento - 70);
  text("Conheça os criadores", width/2, yBase + espacamento * 2 - 70);
  
  // Botões com efeitos especiais (reposicionados)
  desenharBotao(width / 2, yBase, "JOGAR", color(0, 200, 100), botaoJogarHover);
  desenharBotao(width / 2, yBase + espacamento, "COMO JOGAR", color(50, 150, 255), botaoInstrucoesHover);
  desenharBotao(width / 2, yBase + espacamento * 2, "CRÉDITOS", color(200, 100, 255), botaoCreditosHover);
  
  // Mostrar melhor tempo com efeito especial se for novo recorde
  if (bestTime > 0) {
    let cor = novoRecorde ? color(255, 215, 0) : color(180, 220, 255);
    let tamanho = novoRecorde ? 28 + sin(frameCount * 0.1) * 2 : 24;
    
    fill(cor);
    textSize(tamanho);
    text("Melhor tempo: " + formatarTempo(bestTime), width/2, 200);
    
    if (novoRecorde) {
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(255, 215, 0);
      
      // Texto "NOVO RECORDE!" piscante
      if (frameCount % 60 < 30) {
        fill(255, 100, 100);
        textSize(28);
        text("NOVO RECORDE!", width/2, 240);
      }
      drawingContext.shadowBlur = 0;
    }
  }
  
  // Instrução para hitbox
  fill(180, 220, 255);
  textSize(16);
  text("Pressione 'H' durante o jogo para mostrar/ocultar o hitbox", width/2, height-60);
  
  // Instrução para música
  fill(180, 220, 255);
  textSize(16);
  text("Pressione 'M' para mutar/desmutar a música", width/2, height-30);
}

function desenharFundoEstrelas(estrelas, r, g, b) {
  // Fundo gradiente escuro
  background(10, 20, 40);
  
  // Desenha e atualiza estrelas
  for (let i = 0; i < estrelas.length; i++) {
    let estrela = estrelas[i];
    
    // Atualiza posição (movimento vertical)
    estrela.y += estrela.speed;
    
    // Reseta estrela quando sair da tela
    if (estrela.y > height) {
      estrela.y = 0;
      estrela.x = random(width);
    }
    
    // Desenha estrela
    fill(r, g, b, estrela.alpha);
    noStroke();
    circle(estrela.x, estrela.y, estrela.size);
    
    // Efeito de brilho aleatório
    if (random() > 0.99) {
      fill(255, 255, 255, 200);
      circle(estrela.x, estrela.y, estrela.size * 3);
    }
  }
}

function desenharBotao(x, y, texto, cor, hover) {
  // Efeito de partículas no hover
  if (hover && frameCount % 3 === 0) {
    criarParticulaBotao(x, y, cor);
  }
  
  // Brilho externo no hover
  if (hover) {
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = cor;
  }
  
  // Corpo do botão (hexagonal)
  fill(cor);
  noStroke();
  beginShape();
  for (let i = 0; i < 6; i++) {
    let angle = TWO_PI / 6 * i;
    let r = hover ? 55 : 50;
    vertex(x + r * cos(angle), y + r * sin(angle));
  }
  endShape(CLOSE);
  
  // Resetar efeitos de sombra
  drawingContext.shadowBlur = 0;
  
  // Efeito de gradiente interno
  for (let i = 0; i < 5; i++) {
    let alpha = hover ? 100 - i*20 : 80 - i*15;
    fill(255, 255, 255, alpha);
    beginShape();
    for (let j = 0; j < 6; j++) {
      let angle = TWO_PI / 6 * j;
      let r = hover ? 45 - i*4 : 40 - i*4;
      vertex(x + r * cos(angle), y + r * sin(angle));
    }
    endShape(CLOSE);
  }
  
  // Texto do botão com efeito 3D
  drawingContext.shadowBlur = 5;
  drawingContext.shadowColor = color(0, 0, 0, 150);
  
  fill(255);
  noStroke();
  textSize(24);
  text(texto, x, y);
  
  // Resetar efeitos
  drawingContext.shadowBlur = 0;
}

function mostrarTelaInstrucoes() {
  // Fundo gradiente fixo
  drawGradientBackground(40, 30, 80, 180, 120, 220);
  
  // Conteúdo
  drawingContext.shadowBlur = 3;
  drawingContext.shadowColor = color(0, 0, 0, 100);
  fill(255);
  textSize(24);
  text("◀ Setinha ESQUERDA: mover para esquerda\n▶ Setinha DIREITA: mover para direita\n⬆ Setinha CIMA: Atirar (tiros limitados!)\n\n✨ Desvie dos meteoros brancos!\n💥 Colisão = Perde vida!\n⏱️ Sobreviva até o tempo acabar!", width / 2, height / 2);
  drawingContext.shadowBlur = 0;
  
  desenharBotaoVoltar(botaoVoltarHover);
}

function mostrarTelaCreditos() {
  // Fundo gradiente fixo
  drawGradientBackground(180, 30, 220, 120, 100, 255);
  
  drawingContext.shadowBlur = 3;
  drawingContext.shadowColor = color(0, 0, 0, 100);
  fill(255);
  textSize(24);
  text("Desenvolvido por Erik Bandeira\n\nEstilo: Jogos clássicos 32-bits\nTecnologia: P5.js\n\n✨ Versão 1.0 ✨", width / 2, height / 2);
  drawingContext.shadowBlur = 0;
  
  desenharBotaoVoltar(botaoVoltarHover);
}

function drawGradientBackground(r1, g1, b1, r2, g2, b2) {
  // Gradiente que cobre todo o canvas
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let r = lerp(r1, r2, inter);
    let g = lerp(g1, g2, inter);
    let b = lerp(b1, b2, inter);
    stroke(r, g, b);
    line(0, y, width, y);
  }
}

function desenharBotaoVoltar(hover, x = 90, y = 50) {
  // Efeito de brilho no hover
  if (hover) {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(255, 100, 100);
  }
  
  // Botão circular com efeito
  fill(255, 80, 80);
  noStroke();
  ellipse(x, y, hover ? 70 : 65);
  
  // Efeito de gradiente interno
  for (let i = 0; i < 5; i++) {
    fill(255, 255, 255, hover ? 80 - i*15 : 60 - i*12);
    ellipse(x, y, hover ? 55 - i*5 : 50 - i*5);
  }
  
  // Resetar efeitos de sombra
  drawingContext.shadowBlur = 0;
  
  // Ícone e texto
  fill(255);
  textSize(18);
  text("← VOLTAR", x, y);
}

function mouseClicked() {
  // Tocar som de clique
  if (somClique && !somClique.isPlaying()) {
    somClique.play();
  }
  
  if (estadoJogo === 0) {
    if (botaoJogarHover) {
      iniciarFaseDesvio();
      estadoJogo = 1;
    } else if (botaoInstrucoesHover) {
      estadoJogo = 2;
    } else if (botaoCreditosHover) {
      estadoJogo = 3;
    }
  } else if (estadoJogo === 2 || estadoJogo === 3) {
    if (botaoVoltarHover) {
      estadoJogo = 0;
      loop();
    }
  } else if (estadoJogo === 1) {
    if (botaoVoltarJogoHover) {
      // Parar música do jogo se estiver tocando
      if (somMusicaJogo && somMusicaJogo.isPlaying()) {
        somMusicaJogo.stop();
      }
      
      // Voltar ao menu
      estadoJogo = 0;
      
      // Reiniciar música do menu
      if (somMusicaMenu && !somMusicaMenu.isPlaying()) {
        somMusicaMenu.loop();
      }
    }
  }
  // Clique no botão "VOLTAR AO MENU" das telas de fim de jogo
  else if ((estadoJogo === 4 || estadoJogo === 5) && botaoVoltarGameOverHover) {
    if (somClique && !somClique.isPlaying()) {
      somClique.play();
    }
    
    // Voltar ao menu
    estadoJogo = 0;
    
    // Reiniciar música do menu
    if (somMusicaMenu && !somMusicaMenu.isPlaying()) {
      somMusicaMenu.loop();
    }
  }
}

function iniciarFaseDesvio() {
  jogador = {
    x: width / 2,
    y: height - 100, 
    largura: 200,  
    altura: 200, 
    colisaoLargura: 90, 
    colisaoAltura: 80,
    velocidade: 10,
    podeAtirar: true
  };
  listaObstaculos = [];
  listaTiros = [];
  qtdVidas = 3;
  tempoRestante = tempoMaximo;
  tirosDisponiveis = 15;
  meteorosAtingidos = 0;
  frameCount = 0;
  novoRecorde = false; // Resetar estado de novo recorde
  
  // Trocar música
  if (somMusicaMenu && somMusicaMenu.isPlaying()) {
    somMusicaMenu.stop();
  }
  if (somMusicaJogo && !somMusicaJogo.isPlaying()) {
    somMusicaJogo.loop();
  }
  
  loop();
}

function executarFaseDesvio() {
  // Fundo com estrelas móveis
  desenharFundoEstrelas(estrelasJogo, 100, 200, 255);
  
  atualizarJogador();
  desenharJogador();
  gerarObstaculos();
  desenharObstaculos();
  atualizarTiros();
  verificarColisoes();
  mostrarStatusJogo();
  
  // Atualizar animação de novo recorde
  if (novoRecorde) {
    recordeAnimacao++;
    if (recordeAnimacao > 180) { // 3 segundos de animação
      novoRecorde = false;
      recordeAnimacao = 0;
    }
  }
  
  // Desenhar botão voltar no jogo
  desenharBotaoVoltar(botaoVoltarJogoHover, 90, 50);
  
  // Atualizar estado do botão voltar do jogo
  botaoVoltarJogoHover = (dist(mouseX, mouseY, 90, 50) < 40);
  
  // Verificar se o jogador estabeleceu um novo recorde DURANTE o jogo
  verificarNovoRecorde();
  
  if (tempoRestante <= 0) {
    // Mudar para estado de Missão Concluída
    estadoJogo = 5; 
    
    // Parar música do jogo
    if (somMusicaJogo && somMusicaJogo.isPlaying()) {
      somMusicaJogo.stop();
    }
  }
}

function verificarNovoRecorde() {
  // Calcula o tempo de sobrevivência (tempo decorrido)
  let tempoDecorrido = tempoMaximo - tempoRestante;
  
  // Se o tempo decorrido for maior que o recorde atual
  if (tempoDecorrido > bestTime) {
    // Atualizar o recorde
    bestTime = tempoDecorrido;
    localStorage.setItem('spaceDefenderBestTime', bestTime);
    
    // Ativar efeito de novo recorde
    novoRecorde = true;
    recordeAnimacao = 0;
    
    // Tocar som de novo recorde (se disponível)
    if (somClique && !somClique.isPlaying()) {
      somClique.play();
    }
  }
}

function atualizarJogador() {
  if (keyIsDown(LEFT_ARROW)) jogador.x -= jogador.velocidade;
  if (keyIsDown(RIGHT_ARROW)) jogador.x += jogador.velocidade;
  jogador.x = constrain(jogador.x, jogador.largura / 2, width - jogador.largura / 2);

  if (keyIsDown(UP_ARROW) && jogador.podeAtirar && listaTiros.length < 1 && tirosDisponiveis > 0) {
    listaTiros.push(criarTiro(jogador.x, jogador.y - jogador.altura / 2));
    tirosDisponiveis--;
    jogador.podeAtirar = false;
    
    // Tocar som de tiro
    if (somTiro && !somTiro.isPlaying()) {
      somTiro.play();
    }
  }

  if (!keyIsDown(UP_ARROW)) {
    jogador.podeAtirar = true;
  }
}

function desenharJogador() {
  push();
  // Usar imagem da nave com tamanho aumentado para corresponder ao container
  imageMode(CENTER);
  image(naveImg, jogador.x, jogador.y, jogador.largura, jogador.altura);
  
  // Mostrar container de colisão se debug ativado
  if (mostrarHitbox) {
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(jogador.x, jogador.y, jogador.colisaoLargura, jogador.colisaoAltura);
    
    // Texto informativo
    fill(255, 0, 0);
    textSize(12);
    text("Hitbox (Pressione 'H')", jogador.x, jogador.y + jogador.altura/2 + 20);
  }
  pop();
}

function criarObstaculo(x) {
  return {
    x: x,
    y: -20,
    tamanho: random(40, 60),
    velocidade: random(10, 18),
    rotacao: 0,
    velocidadeRotacao: random(-0.1, 0.1)
  };
}

function gerarObstaculos() {
  if (frameCount % 60 === 0) {
    listaObstaculos.push(criarObstaculo(random(70, width - 70)));
  }
}

function desenharObstaculos() {
  for (let i = listaObstaculos.length - 1; i >= 0; i--) {
    let obstaculo = listaObstaculos[i];
    obstaculo.y += obstaculo.velocidade;
    obstaculo.rotacao += obstaculo.velocidadeRotacao;
    
    push();
    translate(obstaculo.x, obstaculo.y);
    rotate(obstaculo.rotacao);
    
    // Meteoro com detalhes
    fill(220);
    stroke(180);
    strokeWeight(2);
    ellipse(0, 0, obstaculo.tamanho);
    
    // Crateras
    fill(180);
    noStroke();
    ellipse(-obstaculo.tamanho*0.2, -obstaculo.tamanho*0.1, obstaculo.tamanho*0.3);
    ellipse(obstaculo.tamanho*0.15, obstaculo.tamanho*0.2, obstaculo.tamanho*0.25);
    
    pop();
  }
}

function criarTiro(x, y) {
  return {
    x: x,
    y: y,
    largura: 8,      
    altura: 30,       
    velocidade: 12
  };
}

function atualizarTiros() {
  for (let i = listaTiros.length - 1; i >= 0; i--) {
    let tiro = listaTiros[i];
    tiro.y -= tiro.velocidade;
    
    // Efeito de partícula
    for (let j = 0; j < 3; j++) {
      fill(random(200, 255), random(100, 200), 0);
      noStroke();
      ellipse(tiro.x + random(-5, 5), tiro.y + tiro.altura/2 + random(8), random(3, 8));
    }
    
    if (tiro.y < -tiro.altura) {
      listaTiros.splice(i, 1);
    } else {
      // Tiro com efeito
      push();
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(255, 200, 0);
      
      fill(255, 220, 0);
      noStroke();
      rectMode(CENTER);
      rect(tiro.x, tiro.y, tiro.largura, tiro.altura);
      pop();
    }
  }
}

function verificarColisoes() {
  for (let i = listaObstaculos.length - 1; i >= 0; i--) {
    let obstaculo = listaObstaculos[i];

    // Verifica colisões entre tiros e obstáculos
    for (let j = listaTiros.length - 1; j >= 0; j--) {
      let tiro = listaTiros[j];
      
      // Detecção de colisão retângulo (tiro) vs círculo (meteoro)
      if (
        obstaculo.y - obstaculo.tamanho / 2 < tiro.y + tiro.altura / 2 &&
        obstaculo.y + obstaculo.tamanho / 2 > tiro.y - tiro.altura / 2 &&
        obstaculo.x + obstaculo.tamanho / 2 > tiro.x - tiro.largura / 2 &&
        obstaculo.x - obstaculo.tamanho / 2 < tiro.x + tiro.largura / 2
      ) {
        // Efeito de explosão
        for (let k = 0; k < 30; k++) {
          fill(random(200, 255), random(150, 220), random(0, 100));
          noStroke();
          ellipse(
            obstaculo.x + random(-30, 30), 
            obstaculo.y + random(-30, 30), 
            random(8, 20)
          );
        }
        
        // Tocar som de explosão
        if (somExplosao && !somExplosao.isPlaying()) {
          somExplosao.play();
        }
        
        // Incrementa contador de meteoros atingidos
        meteorosAtingidos++;
        
        // Remove o meteoro e o tiro
        listaObstaculos.splice(i, 1);
        listaTiros.splice(j, 1);
        break;
      }
    }

    // Verifica colisão entre jogador e obstáculo
    if (
      obstaculo.y + obstaculo.tamanho / 2 > jogador.y - jogador.colisaoAltura / 2 &&
      obstaculo.y - obstaculo.tamanho / 2 < jogador.y + jogador.colisaoAltura / 2 &&
      obstaculo.x + obstaculo.tamanho / 2 > jogador.x - jogador.colisaoLargura / 2 &&
      obstaculo.x - obstaculo.tamanho / 2 < jogador.x + jogador.colisaoLargura / 2
    ) {
      qtdVidas--;
      
      // Tocar som de colisão
      if (somColisao && !somColisao.isPlaying()) {
        somColisao.play();
      }
      
      // Efeito de dano
      push();
      fill(255, 0, 0, 150);
      rectMode(CENTER);
      rect(
        jogador.x, 
        jogador.y, 
        jogador.colisaoLargura * 1.2, 
        jogador.colisaoAltura * 1.2
      );
      pop();
      
      listaObstaculos.splice(i, 1);
      if (qtdVidas <= 0) {
        // Calcular tempo de sobrevivência
        let tempoDecorrido = tempoMaximo - tempoRestante;
        
        // Verificar se foi estabelecido um novo recorde
        if (tempoDecorrido > bestTime) {
          bestTime = tempoDecorrido;
          localStorage.setItem('spaceDefenderBestTime', bestTime);
          novoRecorde = true;
        }
        
        // Mudar para estado de Game Over
        estadoJogo = 4; 
        
        // Parar música do jogo
        if (somMusicaJogo && somMusicaJogo.isPlaying()) {
          somMusicaJogo.stop();
        }
      }
    }

    // Remove obstáculos que saíram da tela
    if (listaObstaculos[i] && listaObstaculos[i].y > height) {
      listaObstaculos.splice(i, 1);
    }
  }
}

function mostrarStatusJogo() {
  let x = width - 110;
  let y = 85;
  
  push();
  // Fundo do painel aumentado
  fill(20, 40, 80, 180);
  stroke(100, 180, 255);
  strokeWeight(2);
  rectMode(CENTER);
  rect(x, y, 180, 150, 15);
  
  // Divisores (4 linhas)
  stroke(80, 160, 220, 150);
  line(x - 80, y - 45, x + 80, y - 45);
  line(x - 80, y - 15, x + 80, y - 15);
  line(x - 80, y + 15, x + 80, y + 15);
  line(x - 80, y + 45, x + 80, y + 45);
  
  // Título do painel
  fill(180, 220, 255);
  textSize(18);
  text("STATUS DA MISSÃO", x, y - 60);
  
  // Vidas
  fill(255);
  textSize(16);
  text("VIDAS:", x - 45, y - 30);
  for (let i = 0; i < 3; i++) {
    fill(i < qtdVidas ? 255 : 80, 0, 0);
    ellipse(x + 15 + i * 20, y - 30, 15);
  }
  
  // Tiros
  fill(255);
  text("TIROS:", x - 45, y);
  fill(255, 220, 0);
  text(tirosDisponiveis, x + 30, y);
  
  // Meteoros atingidos
  fill(255);
  text("METEOROS:", x - 45, y + 30);
  fill(255, 150, 50);
  text(meteorosAtingidos, x + 30, y + 30);
  
  // Tempo decorrido (melhor que tempo restante para recorde)
  let tempoDecorrido = tempoMaximo - tempoRestante;
  fill(255);
  text("TEMPO:", x - 45, y + 60);
  
  // Destacar se for novo recorde
  if (tempoDecorrido > bestTime && novoRecorde) {
    fill(255, 215, 0);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = color(255, 215, 0);
  } else {
    fill(100, 255, 150);
  }
  
  text(tempoDecorrido + "s", x + 30, y + 60);
  
  // Resetar efeitos de sombra
  drawingContext.shadowBlur = 0;
  pop();
  
  // Mostrar notificação de novo recorde
  if (novoRecorde && recordeAnimacao < 120) {
    push();
    fill(255, 215, 0, 200 - recordeAnimacao * 2);
    noStroke();
    textSize(28);
    textAlign(CENTER, CENTER);
    text("⭐ NOVO RECORDE! ⭐", width / 2, 100);
    pop();
  }
}

function atualizarContadorTempo() {
  if (tempoRestante > 0 && estadoJogo === 1) {
    tempoRestante--;
  }
}

// Função para mostrar tela de Game Over
function mostrarTelaGameOver() {
  desenharFundoEstrelas(estrelasJogo, 100, 200, 255);
  
  // Mensagem central
  push();
  // Fundo semi-transparente
  fill(0, 0, 0, 200);
  rectMode(CENTER);
  rect(width/2, height/2, 600, 150, 20);
  
  // Texto da mensagem
  fill(255, 50, 50);
  textSize(60);
  textStyle(BOLD);
  text("GAME OVER", width / 2, height / 2);
  textStyle(NORMAL);
  pop();
  
  // Calcular tempo de sobrevivência
  let tempoDecorrido = tempoMaximo - tempoRestante;
  
  // Exibir tempo sobrevivido
  fill(255, 255, 0);
  textSize(36);
  text("Tempo sobrevivido: " + formatarTempo(tempoDecorrido), width/2, height/2 + 80);
  
  // Verificar se foi estabelecido um novo recorde
  if (tempoDecorrido > bestTime) {
    // Atualizar recorde
    bestTime = tempoDecorrido;
    localStorage.setItem('spaceDefenderBestTime', bestTime);
    novoRecorde = true;
    
    // Exibir mensagem de novo recorde
    fill(255, 215, 0);
    textSize(42);
    text("⭐ NOVO RECORDE! ⭐", width/2, height/2 + 130);
  } else if (tempoDecorrido === bestTime && bestTime > 0) {
    // Exibir mensagem de recorde igualado
    fill(180, 220, 255);
    textSize(36);
    text("Recorde igualado!", width/2, height/2 + 130);
  }
  
  // Botão de voltar ao menu
  desenharBotaoVoltarAoMenu();
}

// Função para mostrar tela de Missão Completa
function mostrarTelaMissaoCompleta() {
  desenharFundoEstrelas(estrelasJogo, 100, 200, 255);
  
  // Mensagem central
  push();
  // Fundo semi-transparente
  fill(0, 0, 0, 200);
  rectMode(CENTER);
  rect(width/2, height/2, 600, 150, 20);
  
  // Texto da mensagem
  fill(50, 255, 100);
  textSize(60);
  textStyle(BOLD);
  text("MISSÃO CONCLUÍDA", width / 2, height / 2);
  textStyle(NORMAL);
  pop();
  
  // Calcular tempo de sobrevivência
  let tempoDecorrido = tempoMaximo - tempoRestante;
  
  // Exibir tempo sobrevivido
  fill(255, 255, 0);
  textSize(36);
  text("Tempo sobrevivido: " + formatarTempo(tempoDecorrido), width/2, height/2 + 80);
  
  // Verificar se foi estabelecido um novo recorde
  if (tempoDecorrido > bestTime) {
    // Atualizar recorde
    bestTime = tempoDecorrido;
    localStorage.setItem('spaceDefenderBestTime', bestTime);
    novoRecorde = true;
    
    // Exibir mensagem de novo recorde
    fill(255, 215, 0);
    textSize(42);
    text("⭐ NOVO RECORDE! ⭐", width/2, height/2 + 130);
  } else if (tempoDecorrido === bestTime && bestTime > 0) {
    // Exibir mensagem de recorde igualado
    fill(180, 220, 255);
    textSize(36);
    text("Recorde igualado!", width/2, height/2 + 130);
  }
  
  // Botão de voltar ao menu
  desenharBotaoVoltarAoMenu();
}

// Função para desenhar o botão "VOLTAR AO MENU" nas telas de fim de jogo
function desenharBotaoVoltarAoMenu() {
  const x = width / 2;
  const y = height / 2 + 150;
  
  // Atualiza estado do hover
  botaoVoltarGameOverHover = (dist(mouseX, mouseY, x, y) < 50);
  
  // Desenha o botão
  desenharBotao(x, y, "VOLTAR AO MENU", color(100, 200, 255), botaoVoltarGameOverHover);
}

// Função para formatar o tempo em mm:ss
function formatarTempo(segundos) {
  let min = floor(segundos / 60);
  let seg = segundos % 60;
  return min.toString().padStart(2, '0') + ':' + seg.toString().padStart(2, '0');
}