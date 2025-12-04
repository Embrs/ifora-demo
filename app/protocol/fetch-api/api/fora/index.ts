/**
 * FORA Ring & iFORA O2 Web API 服務
 * @see .windsurf/doc/FORA_API_DOCUMENTATION.md
 */

import * as mock from './mock';

// ==================== 設定 ====================

const IsMock = () => {
  const { public: { testMode } } = useRuntimeConfig();
  return testMode === 'T';
};

/** FORA API Base URL (透過 Server API Route 代理解決 CORS) */
const FORA_BASE_URL = '/fora-api';


// ==================== FORA 專用請求方法 ====================

/** 獲取 FORA Token (從 StoreSelf) */
const GetForaToken = () => {
  try {
    const storeSelf = StoreSelf();
    return storeSelf.foraToken || '';
  } catch {
    return '';
  }
};

/**
 * FORA API 專用 POST 請求
 * @description 不使用 methods.ts 因為回應格式不同
 * @param url API URL
 * @param body 請求 body
 * @param useToken 是否使用 token (預設 true，會自動從 StoreSelf 獲取)
 */
const ForaPost = async <T>(url: string, body: object, useToken = true): Promise<ApiRes<T>> => {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    // 自動從 StoreSelf 獲取 token
    if (useToken) {
      const token = GetForaToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await $fetch<T>(url, {
      method: 'POST',
      headers,
      body,
    });

    // FORA API 直接回傳數據，包裝成 ApiRes 格式
    return {
      data: response,
      status: { code: 0, message: { zh_tw: '', en: '', ja: '' } },
    } as ApiRes<T>;
  } catch (err: any) {
    console.error('[FORA API Error]', url, err);
    return {
      data: {} as T,
      status: { code: 9999, message: { zh_tw: err.message || '請求失敗', en: '', ja: '' } },
    } as ApiRes<T>;
  }
};

// ==================== FORA Ring Client API ====================

/** 血氧心率 (mode=0) */
export const GetSpO2HR = (params: ForaSpO2HRParams) => {
  if (IsMock()) return mock.GetSpO2HR();
  return ForaPost<ForaSpO2HRRes>(`${FORA_BASE_URL}/ForaO2API/ClientRingDataAES`, { ...params, mode: 0 });
};

/** 活動分析 (mode=1) */
export const GetActivity = (params: ForaActivityParams) => {
  if (IsMock()) return mock.GetActivity();
  return ForaPost<ForaActivityRes>(`${FORA_BASE_URL}/ForaO2API/ClientRingDataAES`, { ...params, mode: 1 });
};

/** 睡眠分析 (mode=3) */
export const GetSleep = (params: ForaSleepParams) => {
  if (IsMock()) return mock.GetSleep();
  return ForaPost<ForaSleepRes>(`${FORA_BASE_URL}/ForaO2API/ClientRingDataAES`, { ...params, mode: 3 });
};

// ==================== iFORA O2 Web API ====================

/** 群組登入 (不需要 token) */
export const GroupLogin = (params: ForaGroupLoginParams) => {
  if (IsMock()) return mock.GroupLogin();
  return ForaPost<ForaGroupLoginRes>(`${FORA_BASE_URL}/TaidocWeb/GroupLoginAES`, params, false);
};

/** 病患/授權清單 */
export const GetGroupUserList = (params: ForaGroupUserListParams) => {
  if (IsMock()) return mock.GetGroupUserList();
  return ForaPost<ForaGroupUserListRes>(`${FORA_BASE_URL}/TaidocWeb/QryGroupUserListO2WebAES`, params);
};

/** 使用者檔案清單 */
export const GetUserFileList = (params: ForaUserFileListParams) => {
  if (IsMock()) return mock.GetUserFileList();
  return ForaPost<ForaUserFileListRes>(`${FORA_BASE_URL}/TaidocWeb/QryUserFileListO2WebAES`, params);
};

/** 分析結果 */
export const GetAnalysisResult = (params: ForaAnalysisResultParams) => {
  if (IsMock()) return mock.GetAnalysisResult();
  return ForaPost<ForaAnalysisResultRes>(`${FORA_BASE_URL}/TaidocWeb/AnalysisResultO2WebAES`, params);
};

/** 問答清單 */
export const GetQAList = (params: ForaQAListParams) => {
  if (IsMock()) return mock.GetQAList();
  return ForaPost<ForaQAListRes>(`${FORA_BASE_URL}/TaidocWeb/QueryQAListO2WebAES`, params);
};

// ==================== 工具函式 ====================

/** 組合睡眠 PDF URL */
export const GetSleepPdfUrl = (resultData: string, filename: string, lang: ForaLang = 'tw'): string => {
  const langSuffix = lang === 'tw' ? '_tw' : '_en';
  return `${FORA_BASE_URL}/${resultData}/${filename}${langSuffix}.png`;
};

/** 解析睡眠總覽 */
export const ParseStageSummary = (stageSummary: string) => {
  try {
    const s = JSON.parse(stageSummary) as number[];
    return { totalMinutes: s[0] ?? 0, deepRatio: s[1] ?? 0, lightRatio: s[2] ?? 0, remRatio: s[3] ?? 0, awakeRatio: s[4] ?? 0 };
  } catch { return null; }
};

/** 解析睡眠評分 */
export const ParseSleepScore = (sleepScore: string) => {
  try {
    const s = JSON.parse(sleepScore) as number[];
    return { totalScore: s[0] ?? 0, totalTimeScore: s[1] ?? 0, deepSleepScore: s[2] ?? 0, awakeRatioScore: s[3] ?? 0, bodyQuietScore: s[4] ?? 0, lightDeepRatioScore: s[5] ?? 0, bodyRestlessIndex: s[6] ?? 0, bodyRestlessScore: s[7] ?? 0, apneaScore: s[8] ?? 0 };
  } catch { return null; }
};

/** 解析 HRV 數據 */
export const ParseHRVData = (resultData: string[]) => {
  const row = resultData?.[0];
  if (!row) return null;
  const v = row.split(',').map(Number);
  return { heartRate: v[12] ?? 0, sdnn: v[0] ?? 0, lf: v[5] ?? 0, hf: v[6] ?? 0, lfHfRatio: v[9] ?? 0 };
};

/** 解析 BHRV 數據 */
export const ParseBHRVData = (resultData: string[]) => {
  const row = resultData?.[0];
  if (!row) return null;
  const v = row.split(',').map(Number);
  return { duration: v[19] ?? 0, heartRate: v[12] ?? 0, coherence: v[13] ?? 0, resonance: v[14] ?? 0, breathRate: v[17] ?? 0 };
};
