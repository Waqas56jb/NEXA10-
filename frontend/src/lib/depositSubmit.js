import { addDeposit, readFileAsDataUrl } from './storage';
import { getUserToken, isApiEnabled, userApi } from './api';

export async function submitDepositRequest(payload, refresh) {
  const { exchange, network, email, username, amount, screenshotFile } = payload;

  if (!email || !username || !amount) {
    throw new Error('Please fill in email, username, and transfer amount.');
  }
  if (!screenshotFile) {
    throw new Error('Please upload your payment screenshot.');
  }

  const screenshot = await readFileAsDataUrl(screenshotFile);

  if (isApiEnabled()) {
    if (!getUserToken()) {
      throw new Error('LOGIN_REQUIRED');
    }
    await userApi.submitDeposit({
      exchange,
      network,
      email,
      username,
      amount: parseFloat(amount),
      screenshot,
    });
    if (refresh) await refresh();
    return { ok: true };
  }

  addDeposit({
    exchange,
    network,
    email,
    username,
    amount,
    screenshot,
  });
  if (refresh) refresh();
  return { ok: true };
}
