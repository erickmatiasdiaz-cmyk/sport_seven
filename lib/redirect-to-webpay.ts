// Webpay Plus no se abre con un redirect simple: hay que hacer un POST de
// formulario con el campo `token_ws` hacia la URL que entrega Transbank.
// Este helper arma ese formulario y lo envia desde el navegador.
export function redirectToWebpay(url: string, token: string) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
}
