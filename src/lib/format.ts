const moneyFormatterConCentavos = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyFormatterSinCentavos = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formatea un monto con separador de miles argentino (".") y de
 * decimales (","). Si el valor es un entero exacto, no muestra los
 * centavos (ej. límite de crédito); si no, siempre muestra dos decimales. */
export function formatMoneyAR(value: number): string {
  return Number.isInteger(value)
    ? moneyFormatterSinCentavos.format(value)
    : moneyFormatterConCentavos.format(value);
}
