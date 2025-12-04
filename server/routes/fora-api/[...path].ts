/**
 * FORA API 代理
 * @description 解決 CORS 問題，將請求轉發到 FORA 伺服器，並處理 AES 加解密
 */

import { createCipheriv, createDecipheriv } from 'crypto';

// iFORA O2 Web API 金鑰 (TaidocWeb)
const AES_KEY_WEB = Buffer.from([
  67, 34, 119, 18, 83, 57, 112, 9,
  73, 50, 81, 120, 24, 54, 82, 101
]);

// FORA Ring Client API 金鑰 (ForaO2API/ClientRingDataAES)
const AES_KEY_RING = Buffer.from([
  0x49, 0x32, 0x56, 0x28, 0x66, 0x72, 0x46, 0x26,
  0x39, 0x15, 0x62, 0x46, 0x09, 0x74, 0x23, 0x26
]);

/** 根據路徑選擇正確的 AES 金鑰 */
function getAesKey(path: string): Buffer {
  // ForaO2API 開頭的路徑使用 Ring API 金鑰
  if (path.startsWith('ForaO2API')) {
    return AES_KEY_RING;
  }
  // 其他（TaidocWeb）使用 Web API 金鑰
  return AES_KEY_WEB;
}

/** AES-128-ECB 加密 (Zero Padding) */
function aesEncrypt(data: string, key: Buffer): string {
  // 將數據轉為 Buffer 並補齊到 16 的倍數 (Zero Padding)
  const dataBuffer = Buffer.from(data, 'utf8');
  const blockSize = 16;
  const paddedLength = Math.ceil(dataBuffer.length / blockSize) * blockSize;
  const paddedBuffer = Buffer.alloc(paddedLength, 0);
  dataBuffer.copy(paddedBuffer);
  
  const cipher = createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false); // 使用自定義 padding
  let encrypted = cipher.update(paddedBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('base64');
}

/** AES-128-ECB 解密 */
function aesDecrypt(encryptedData: Buffer, key: Buffer): string {
  try {
    // 嘗試使用 PKCS7 padding
    const decipher = createDecipheriv('aes-128-ecb', key, null);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err1) {
    console.error('[AES Decrypt PKCS7 Error]', err1);
    
    // 嘗試使用 Zero padding (手動移除)
    try {
      const decipher = createDecipheriv('aes-128-ecb', key, null);
      decipher.setAutoPadding(false);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      // 移除 Zero Padding
      let endIndex = decrypted.length;
      while (endIndex > 0 && decrypted[endIndex - 1] === 0) {
        endIndex--;
      }
      return decrypted.subarray(0, endIndex).toString('utf8');
    } catch (err2) {
      console.error('[AES Decrypt Zero Padding Error]', err2);
      // 最後嘗試：直接返回原始數據的 base64
      console.log('[FORA Proxy] Raw Response (hex):', encryptedData.toString('hex').substring(0, 200));
      return '';
    }
  }
}

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path') || '';
  const targetUrl = `https://www.foracare.live/${path}`;
  
  // 根據路徑選擇正確的 AES 金鑰
  const aesKey = getAesKey(path);
  const apiType = path.startsWith('ForaO2API') ? 'Ring' : 'Web';
  
  // 讀取請求 body
  const body = await readBody(event);
  
  // 取得原始請求 headers
  const headers = getHeaders(event);
  const authHeader = headers['authorization'];
  
  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };
    
    // 如果有 Authorization header，轉發它
    if (authHeader) {
      requestHeaders['Authorization'] = authHeader;
    }
    
    // 加密請求 body
    const encryptedBody = aesEncrypt(JSON.stringify(body), aesKey);
    
    console.log(`[FORA Proxy ${apiType}]`, 'POST', targetUrl);
    console.log(`[FORA Proxy ${apiType}] Original Body:`, JSON.stringify(body));
    console.log(`[FORA Proxy ${apiType}] Encrypted Body:`, encryptedBody);
    
    // 嘗試以 raw bytes 發送
    const encryptedBytes = Buffer.from(encryptedBody, 'base64');
    
    const response = await $fetch.raw(targetUrl, {
      method: 'POST',
      headers: {
        ...requestHeaders,
        'Content-Type': 'application/octet-stream',
      },
      body: encryptedBytes,
      responseType: 'arrayBuffer',
    });
    
    // 解密回應
    const encryptedResponse = Buffer.from(response._data as ArrayBuffer);
    const decryptedResponse = aesDecrypt(encryptedResponse, aesKey);
    
    console.log('[FORA Proxy] Decrypted Response:', decryptedResponse);
    
    // 嘗試解析為 JSON
    try {
      return JSON.parse(decryptedResponse);
    } catch {
      return { raw: decryptedResponse };
    }
  } catch (error: any) {
    console.error('[FORA Proxy Error]', targetUrl, error);
    
    // 如果 FORA 伺服器回傳了錯誤回應，嘗試轉發它
    if (error.data) {
      return error.data;
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'FORA API 請求失敗',
    });
  }
});
