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
  const nozzleDiameter = normalizeNumber(
    document.getElementById("nozzleDiameter").value
  );
  const layerHeight = normalizeNumber(
    document.getElementById("layerHeight").value
  );

  if (isNaN(nozzleDiameter) || isNaN(layerHeight)) {
    document.getElementById("result").textContent =
      "Por favor, insira valores válidos.";

    return;
  }

  // Largura de extrusão igual ao diâmetro do bico
  const extrusionWidth = nozzleDiameter;
  const angleRad = Math.atan(
    normalizeNumber(layerHeight / (extrusionWidth / 2))
  );
  const overhangAngle = normalizeNumber(90 - (angleRad * 180) / Math.PI);

  document.getElementById(
    "result"
  ).textContent = `O ângulo máximo de overhang sem suporte é ${overhangAngle}°`;
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
    document.getElementById("result").textContent =
      "Por favor, preencha todas as 20 medições.";

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
    document.getElementById("result").textContent =
      "Por favor, preencha a largura de extrusão e o fluxo do fatiador.";

    return;
  }

  // Calcula o novo fluxo usando regra de três
  const newFlow = normalizeNumber(
    (extrusionWidth / avgMeasurements) * configuredFlow
  );

  document.getElementById(
    "result"
  ).textContent = `O novo fluxo deve ser ajustado para: ${newFlow.toFixed(2)}%`;
}

/**
 * Calcula a altura de camada ideal para o ângulo P.B.C.
 *
 * Entradas:
 *   - Ângulo desejado: input HTML com id "angle".
 *   - Software selecionado: input radio com name "software".
 *   - Diâmetro do bico selecionado: input radio com name "bico".
 *
 * Saídas:
 *   - Atualiza os elementos com ids "result", "errorMessage", "suggestionMessage" e "mensagemSugestao".
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
    document.querySelector('input[name="nozzle"]:checked').value
  );

  // Limpa mensagens anteriores
  document.getElementById("result").innerHTML = "";
  document.getElementById("errorMessage").textContent = "";
  document.getElementById("suggestionMessage").textContent = "";

  if (isNaN(angleInput) || angleInput < 1 || angleInput > 89) {
    document.getElementById("errorMessage").textContent =
      "Por favor, insira um ângulo válido entre 1° e 89°.";

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

  let resultHTML = `Altura da Camada para o Bico ${selectedNozzle.toFixed(
    1
  )} mm: `;

  if (!isWithinBounds || outOfLimits) {
    resultHTML += `<span style="color: red;">${formattedHeight} mm (fora do esperado ou limites)</span>`;
    document.getElementById("suggestionMessage").textContent =
      "Tente novamente com outro ângulo para obter uma altura de camada segura para sua configuração de bico.";
  } else {
    resultHTML += `${formattedHeight} mm (válido)`;
  }

  // Exibe resultado
  document.getElementById("result").innerHTML = resultHTML;
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
    // Campo para velocidade de impressão
    additionalVar.innerHTML = `
      <div class="input-group">
        <input type="number" id="printSpeed" step="5" placeholder="Ex: 60">
        <label for="printSpeed">Velocidade de Impressão (mm/s)</label>
      </div>
    `;
  } else {
    // Campo para velocidade volumétrica
    additionalVar.innerHTML = `
      <div class="input-group">
        <input type="number" id="volumetricSpeed" step="1" placeholder="Ex: 10">
        <label for="volumetricSpeed">Velocidade Volumétrica (mm³/s)</label>
      </div>
    `;
  }
}

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
  const layerHeight = normalizeNumber(
    document.getElementById("layerHeight").value
  );
  const nozzleDiameter = normalizeNumber(
    document.getElementById("nozzleDiameter").value
  );
  const option = document.querySelector(
    'input[name="calculationOption"]:checked'
  ).value;
  let result;

  // Limpa alertas e resultados anteriores
  document.getElementById("alertMessage").innerHTML = "";
  document.getElementById("result").textContent = "";
  document.getElementById("explanation").textContent = "";

  // Verifica proporção da altura da camada
  const minHeight = normalizeNumber(nozzleDiameter * 0.2);
  const maxHeight = normalizeNumber(nozzleDiameter * 0.8);

  if (!isNaN(layerHeight) && !isNaN(nozzleDiameter)) {
    if (layerHeight < minHeight || layerHeight > maxHeight) {
      document.getElementById(
        "alertMessage"
      ).innerHTML += `<p class="alert-vermelho">Alerta: A altura da camada está fora da proporção (20% a 80% do diâmetro do bico).</p>`;
    }
  }

  // Verifica preenchimento dos campos
  if (isNaN(layerHeight)) {
    document.getElementById(
      "alertMessage"
    ).innerHTML += `<p class="alert-laranja">Falta preencher a Altura da Camada!</p>`;
  }

  if (isNaN(nozzleDiameter)) {
    document.getElementById(
      "alertMessage"
    ).innerHTML += `<p class="alert-laranja">Falta preencher o Diâmetro do Bico!</p>`;
  }

  // Checa terceira variável
  if (option === "volumetricSpeed") {
    const printSpeed = normalizeNumber(
      document.getElementById("printSpeed").value
    );

    if (isNaN(printSpeed)) {
      document.getElementById(
        "alertMessage"
      ).innerHTML += `<p class="alert-laranja">Falta preencher a Velocidade de Impressão!</p>`;
      return;
    }

    result = normalizeNumber(layerHeight * nozzleDiameter * printSpeed);

    document.getElementById(
      "result"
    ).textContent = `A Velocidade Volumétrica é: ${result.toFixed(2)} mm³/s`;
    document.getElementById(
      "explanation"
    ).textContent = `Para você imprimir na velocidade ${printSpeed} mm/s, você precisa de um filamento com vazão volumétrica de ${result.toFixed(
      2
    )} mm³/s.`;
  } else {
    const volumetricSpeed = normalizeNumber(
      document.getElementById("volumetricSpeed").value
    );

    if (isNaN(volumetricSpeed)) {
      document.getElementById(
        "alertMessage"
      ).innerHTML += `<p class="alert-laranja">Falta preencher a Velocidade Volumétrica!</p>`;

      return;
    }

    result = normalizeNumber(volumetricSpeed / (layerHeight * nozzleDiameter));

    document.getElementById(
      "result"
    ).textContent = `A Velocidade de Impressão é: ${result.toFixed(2)} mm/s`;
    document.getElementById(
      "explanation"
    ).textContent = `Para imprimir com a vazão volumétrica de ${volumetricSpeed.toFixed(
      2
    )} mm³/s, você precisa atingir a velocidade de ${result.toFixed(2)} mm/s.`;
  }
}
