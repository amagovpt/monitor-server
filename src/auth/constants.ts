const jwtConstants = {
  secret: process.env.SECRET_KEY,
};
const NIC = "http://interop.gov.pt/MDC/Cidadao/NIC";
const NOME_COMPLETO = "http://interop.gov.pt/MDC/Cidadao/NomeCompleto";
const NAME_CONVERTER = {
  [NIC]: "cc",
  [NOME_COMPLETO]: "name"
}

export {
  NIC, NOME_COMPLETO, jwtConstants, NAME_CONVERTER
}