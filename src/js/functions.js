/**
 * Realiza a normalização de um número para um formato float com casas decimais definidas.
 * O processo envolve tornar o número passado na entrada em um float e arrendondá-lo para o
 * número de casas decimais especificado, evitando problemas de precisão com floats em JavaScript.
 *
 * @param {string|number} value - O valor a ser normalizado.
 * @param {number} decimalPlaces - Número de casas decimais para arredondar (padrão é 2).
 *
 * @returns {number} - O número normalizado como float.
 */
function normalizeNumber(value, decimalPlaces = 2) {
  return parseFloat(parseFloat(value).toFixed(decimalPlaces));
}

/**
 * Calcula o ângulo crítico de extrusão (A.C.E.).
 *
 * Entradas:
 *   - Diâmetro do bico: obtido do input HTML com id "nozzleDiameter".
 *   - Altura da camada: obtida do input HTML com id "layerHeight".
 *
 * Saída:
 *   - Atualiza o elemento com id "result" exibindo o ângulo máximo de overhang sem suporte.
 *
 * O que calcula:
 *   - Determina o ângulo máximo que uma camada pode ser impressa sem suporte, baseado na geometria do filamento extrudado.
 *
 * Teoria:
 *   - Utiliza trigonometria para calcular o ângulo de overhang, considerando a altura da camada e o diâmetro do bico.
 *   - O cálculo é baseado na relação entre a altura da camada e a largura de extrusão, usando a função arco-tangente.
 */
function calculateCriticalExtrusionAngle() {
  const resultEl = document.getElementById("result");
  resultEl.textContent = "";
  resultEl.hidden = true;

  const nozzleDiameter = normalizeNumber(
    document.querySelector('input[name="nozzleDiameter"]:checked').value,
    1
  );
  const layerHeight = normalizeNumber(
    document.getElementById("layerHeight").value
  );

  let slicer = "orca";

  const slicerRadio = document.querySelector(
    'input[name="slicerSoftware"]:checked'
  );

  if (slicerRadio) {
    slicer = slicerRadio.value;
  }

  if (isNaN(nozzleDiameter) || isNaN(layerHeight)) {
    resultEl.textContent = "Por favor, insira valores válidos.";
    resultEl.hidden = false;
    return;
  }

  // Largura de extrusão igual ao diâmetro do bico
  const extrusionWidth = nozzleDiameter;
  const angleRad = Math.atan(
    normalizeNumber(layerHeight / (extrusionWidth / 2))
  );
  let overhangAngle = normalizeNumber(90 - (angleRad * 180) / Math.PI);

  // Se Orca, mostrar complementar
  if (slicer === "orca") {
    overhangAngle = normalizeNumber(90 - overhangAngle);
    resultEl.textContent = `Ângulo máximo de inclinação (OrcaSlicer): ${overhangAngle}°`;
  } else {
    resultEl.textContent = `Ângulo máximo de inclinação (Ultimaker Cura): ${overhangAngle}°`;
  }

  resultEl.hidden = false;
}

/**
 * Calcula o novo fluxo para impressão 3D.
 *
 * Entradas:
 *   - 20 medições das paredes do cubo: obtidas dos inputs HTML com ids "wall1_1" a "wall4_5".
 *   - Largura de extrusão configurada: input com id "extrusionWidthSlicer".
 *   - Fluxo configurado no fatiador: input com id "flowSlicer".
 *
 * Saída:
 *   - Atualiza o elemento com id "result" exibindo o novo valor de fluxo recomendado.
 *
 * O que calcula:
 *   - Calcula a média das medições das paredes e ajusta o fluxo do fatiador para compensar variações na extrusão.
 *
 * Teoria:
 *   - Utiliza regra de três para ajustar o fluxo, comparando a largura de extrusão real com a configurada.
 *   - Garante maior precisão dimensional nas peças impressas.
 */
function calculateNewFlow() {
  const resultEl = document.getElementById("result");
  resultEl.textContent = "";
  resultEl.hidden = true;

  // Obter todas as medições das paredes do cubo
  const measurements = [];
  for (let i = 1; i <= 4; i++) {
    for (let j = 1; j <= 5; j++) {
      const value = normalizeNumber(
        document.getElementById(`wall${i}_${j}`).value
      );

      if (!isNaN(value)) {
        measurements.push(value);
      }
    }
  }

  // Verifica se todas as 20 medições foram preenchidas
  if (measurements.length !== 20) {
    resultEl.textContent =
      "Preencha todas as 20 medições para calcular o novo fluxo.";
    resultEl.hidden = false;
    return;
  }

  // Calcula a média das medidas
  const sumMeasurements = measurements.reduce((a, b) => a + b, 0);
  const avgMeasurements = normalizeNumber(
    sumMeasurements / measurements.length
  );

  // Obter largura de extrusão e fluxo configurado
  const extrusionWidth = normalizeNumber(
    document.getElementById("extrusionWidthSlicer").value
  );
  const configuredFlow = normalizeNumber(
    document.getElementById("flowSlicer").value
  );

  if (isNaN(extrusionWidth) || isNaN(configuredFlow)) {
    resultEl.textContent =
      "Informe a largura de extrusão e o fluxo configurado para continuar.";
    resultEl.hidden = false;
    return;
  }

  // Calcula o novo fluxo usando regra de três
  const newFlow = normalizeNumber(
    (extrusionWidth / avgMeasurements) * configuredFlow
  );

  resultEl.textContent = `Novo valor recomendado de fluxo: ${newFlow}%`;
  resultEl.hidden = false;
}

/**
 * Calcula a altura de camada ideal para o ângulo P.B.C.
 *
 * PBC significa "Proporção Bico Camada", uma relação na impressão 3D FDM que conecta
 * o diâmetro do bico à altura da camada impressa.
 *
 * Entradas:
 *   - Ângulo desejado: input HTML com id "angle".
 *   - Software selecionado: input radio com name "software".
 *   - Diâmetro do bico selecionado: input radio com name "bico".
 *
 * Saídas:
 *   - Atualiza os elementos com ids "result", "suggestionMessage" e "mensagemSugestao".
 *
 * O que calcula:
 *   - Determina a altura de camada ideal para um determinado ângulo de parede, considerando o software e o bico.
 *
 * Teoria:
 *   - Utiliza trigonometria para relacionar o ângulo da parede com a altura de camada, considerando limitações práticas do bico.
 *   - Sugere ajustes para garantir múltiplos de 0.02 mm e respeitar limites seguros de impressão.
 */
function calculatePBC() {
  const angleInput = normalizeNumber(document.getElementById("angle").value);
  const selectedSoftware = document.querySelector(
    'input[name="software"]:checked'
  ).value;
  const selectedNozzle = normalizeNumber(
    document.querySelector('input[name="nozzle"]:checked').value,
    1
  );

  // Oculta e limpa mensagens anteriores
  const resultEl = document.getElementById("result");
  const suggestionEl = document.getElementById("suggestionMessage");
  resultEl.innerHTML = "";
  suggestionEl.textContent = "";
  resultEl.hidden = true;
  suggestionEl.hidden = true;

  if (isNaN(angleInput) || angleInput < 1 || angleInput > 89) {
    resultEl.innerHTML = `<span style="color: red;">Informe um ângulo entre 1° e 89° para continuar.</span>`;
    resultEl.hidden = false;
    return;
  }

  // Ajuste do ângulo conforme software
  const orcaAngle = selectedSoftware === "orca" ? angleInput : 90 - angleInput;
  const angleRad = orcaAngle * (Math.PI / 180); // Converter para radianos

  // Calcula altura de camada
  const layerHeight = normalizeNumber(
    Math.tan(angleRad) * (selectedNozzle / 2)
  );
  const formattedHeight = normalizeNumber(layerHeight);

  // Verifica limites de altura
  const minHeight = normalizeNumber(selectedNozzle * 0.2);
  const maxHeight = normalizeNumber(selectedNozzle * 0.8);
  let outOfLimits = formattedHeight < minHeight || formattedHeight > maxHeight;

  // Verifica se altura é múltipla de 0.02
  const roundedHeight = normalizeNumber(
    normalizeNumber(Math.round(formattedHeight / 0.02) * 0.02)
  );
  const isWithinBounds = Math.abs(formattedHeight - roundedHeight) < 0.001;

  let resultHTML = `Altura de camada ideal para o bico ${selectedNozzle} mm: `;

  if (!isWithinBounds || outOfLimits) {
    resultHTML += `<span style="color: red;">${formattedHeight} mm</span>`;
    suggestionEl.textContent =
      "Escolha outro ângulo para obter uma altura de camada segura para sua configuração de bico.";
    suggestionEl.hidden = false;
  } else {
    resultHTML += `${formattedHeight} mm (válido)`;
  }

  // Exibe resultado
  resultEl.innerHTML = resultHTML;
  resultEl.hidden = false;
}

/**
 * Atualiza a interface da calculadora volumétrica.
 *
 * Entrada:
 *   - Opção selecionada: input radio com name "calcularOpcao".
 *
 * Saída:
 *   - Atualiza o elemento com id "variavelAdicional" exibindo o campo correspondente à opção escolhida.
 *
 * O que faz:
 *   - Exibe dinamicamente o campo para velocidade de impressão ou velocidade volumétrica conforme a seleção do usuário.
 *
 * Teoria:
 *   - Facilita a interação do usuário, mostrando apenas os campos relevantes para o cálculo desejado.
 */
function updateVolumetricInterface() {
  const option = document.querySelector(
    'input[name="calculationOption"]:checked'
  ).value;
  const additionalVar = document.getElementById("additionalVariable");

  // Limpa conteúdo atual
  additionalVar.innerHTML = "";

  if (option === "volumetricSpeed") {
    // Campo para velocidade de impressão (Bulma)
    additionalVar.innerHTML = `
      <div class="field">
        <label class="label" for="printSpeed">Velocidade de Impressão (mm/s)</label>
        <div class="control">
          <input class="input" type="number" id="printSpeed" step="5" placeholder="Ex: 60">
        </div>
      </div>
    `;
  } else {
    // Campo para velocidade volumétrica (Bulma)
    additionalVar.innerHTML = `
      <div class="field">
        <label class="label" for="volumetricSpeed">Velocidade Volumétrica (mm³/s)</label>
        <div class="control">
          <input class="input" type="number" id="volumetricSpeed" step="1" placeholder="Ex: 10">
        </div>
      </div>
    `;
  }
}

// Garante que o campo padrão seja exibido ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
  if (
    document.getElementById("additionalVariable") &&
    document.querySelector('input[name="calculationOption"]:checked')
  ) {
    updateVolumetricInterface();
  }
});

/**
 * Calcula valores da calculadora volumétrica.
 *
 * Entradas:
 *   - Altura da camada: input HTML com id "layerHeight".
 *   - Diâmetro do bico: input HTML com id "nozzleDiameter".
 *   - Opção selecionada: input radio com name "calcularOpcao".
 *   - Velocidade de impressão: input com id "printSpeed" (se opção for velocidade volumétrica).
 *   - Velocidade volumétrica: input com id "volumetricSpeed" (se opção for velocidade de impressão).
 *
 * Saídas:
 *   - Atualiza os elementos com ids "alertMessage", "result" e "explanation" com os resultados e explicações.
 *
 * O que calcula:
 *   - Calcula a velocidade volumétrica ou a velocidade de impressão, dependendo da opção escolhida.
 *
 * Teoria:
 *   - Utiliza fórmulas geométricas para relacionar volume extrudado, altura de camada, diâmetro do bico e velocidade.
 *   - Ajuda a ajustar parâmetros para evitar problemas de subextrusão ou sobreextrusão.
 */
function calculateVolumetric() {
  const alertEl = document.getElementById("alertMessage");
  const resultEl = document.getElementById("result");
  const explanationEl = document.getElementById("explanation");

  alertEl.innerHTML = "";
  resultEl.textContent = "";
  explanationEl.textContent = "";

  alertEl.hidden = true;
  resultEl.hidden = true;
  explanationEl.hidden = true;

  const layerHeight = normalizeNumber(
    document.getElementById("layerHeight").value
  );
  const nozzleDiameter = normalizeNumber(
    document.querySelector('input[name="nozzleDiameter"]:checked').value,
    1
  );
  const option = document.querySelector(
    'input[name="calculationOption"]:checked'
  ).value;
  let result;

  // Verifica proporção da altura da camada
  const minHeight = normalizeNumber(nozzleDiameter * 0.2);
  const maxHeight = normalizeNumber(nozzleDiameter * 0.8);

  if (!isNaN(layerHeight) && !isNaN(nozzleDiameter)) {
    if (layerHeight < minHeight || layerHeight > maxHeight) {
      alertEl.innerHTML += `<p class="alert-vermelho">Atenção: A altura da camada está fora da proporção recomendada (20% a 80% do diâmetro do bico).</p>`;
      alertEl.hidden = false;
    }
  }

  // Verifica preenchimento dos campos
  if (isNaN(layerHeight)) {
    alertEl.innerHTML += `<p class="alert-laranja">Informe a altura da camada para continuar.</p>`;
    alertEl.hidden = false;
  }

  if (isNaN(nozzleDiameter)) {
    alertEl.innerHTML += `<p class="alert-laranja">Informe o diâmetro do bico para continuar.</p>`;
    alertEl.hidden = false;
  }

  // Checa terceira variável
  if (option === "volumetricSpeed") {
    const printSpeed = normalizeNumber(
      document.getElementById("printSpeed").value
    );

    if (isNaN(printSpeed)) {
      alertEl.innerHTML += `<p class="alert-laranja">Informe a velocidade de impressão para realizar o cálculo.</p>`;
      alertEl.hidden = false;
      return;
    }

    result = normalizeNumber(layerHeight * nozzleDiameter * printSpeed);

    resultEl.textContent = `Velocidade volumétrica calculada: ${result} mm³/s`;
    explanationEl.textContent = `Para imprimir a ${printSpeed} mm/s, o filamento deve fornecer uma vazão volumétrica de ${result} mm³/s.`;
    resultEl.hidden = false;
    explanationEl.hidden = false;
  } else {
    const volumetricSpeed = normalizeNumber(
      document.getElementById("volumetricSpeed").value
    );

    if (isNaN(volumetricSpeed)) {
      alertEl.innerHTML += `<p class="alert-laranja">Informe a velocidade volumétrica para realizar o cálculo.</p>`;
      alertEl.hidden = false;
      return;
    }

    result = normalizeNumber(volumetricSpeed / (layerHeight * nozzleDiameter));

    resultEl.textContent = `Velocidade de impressão calculada: ${result} mm/s`;
    explanationEl.textContent = `Para imprimir com vazão volumétrica de ${volumetricSpeed} mm³/s, ajuste a velocidade para ${result} mm/s.`;
    resultEl.hidden = false;
    explanationEl.hidden = false;
  }
}

/**
 * Controle de tema claro/escuro sincronizado entre páginas.
 * Detecta tema do sistema, salva preferência no localStorage e aplica o tema.
 */
(function () {
  const THEME_KEY = "theme";
  const DARK_CLASS = "dark-theme";
  const LIGHT_CLASS = "light-theme";

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY);
  }

  function setTheme(theme) {
    document.documentElement.classList.remove(DARK_CLASS, LIGHT_CLASS);
    if (theme === "dark") {
      document.documentElement.classList.add(DARK_CLASS);
    } else {
      document.documentElement.classList.add(LIGHT_CLASS);
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function syncTheme() {
    let theme = getSavedTheme();
    if (!theme) {
      theme = getSystemTheme();
      localStorage.setItem(THEME_KEY, theme);
    }
    setTheme(theme);
    // Sincroniza tema entre abas
    window.addEventListener("storage", (e) => {
      if (e.key === THEME_KEY) setTheme(e.newValue);
    });
  }

  function toggleTheme() {
    const current = getSavedTheme() || getSystemTheme();
    const next = current === "dark" ? "light" : "dark";

    setTheme(next);

    // Atualiza visual do botão de alternância
    const btn = document.getElementById("theme-toggle");

    if (btn) {
      btn.className = `button ${
        next === "light" ? "is-light" : "is-dark"
      } navbar-item is-rounded`;

      const icon = btn.querySelector("i");

      if (icon) {
        icon.classList.remove("fa-sun", "fa-moon");
        icon.classList.add(next === "light" ? "fa-sun" : "fa-moon");
      }
    }
  }

  // Adiciona botão de alternância ao menu
  function injectThemeToggle() {
    const nav = document.querySelector(".navbar-menu");

    if (!nav || document.getElementById("theme-toggle")) return;

    const endDiv = document.createElement("div");
    endDiv.className = "navbar-end";

    const isThemeLight = getSavedTheme() === LIGHT_CLASS;

    const btn = document.createElement("button");
    btn.className = `button ${
      isThemeLight ? "is-light" : "is-dark"
    } navbar-item is-rounded`;
    btn.id = "theme-toggle";
    btn.innerHTML = '<span class="icon"><i class="fas fa-sun"></i></span>';
    btn.onclick = toggleTheme;

    endDiv.appendChild(btn);

    nav.appendChild(endDiv);
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncTheme();
    injectThemeToggle();
  });
})();
