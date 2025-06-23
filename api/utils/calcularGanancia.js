function calcularGanancia(costoUnidad) {
  return parseFloat((costoUnidad * 0.05).toFixed(2));
}

module.exports = calcularGanancia;
