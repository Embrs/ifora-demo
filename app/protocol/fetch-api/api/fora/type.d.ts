/**
 * FORA Ring & iFORA O2 Web API 型別定義
 * @see .windsurf/doc/FORA_API_DOCUMENTATION.md
 */

// ==================== FORA Ring Client API ====================

// ----- 血氧心率 (mode=0) -----

interface ForaSpO2HRParams {
  user_id: string
  start_dt: string  // YYYY-MM-DD HH:mm:ss
  end_dt: string
  mode: 0
}

interface ForaSpO2HRData {
  meter_sn: string
  spo2: number
  hr: number
  quality: number
  hear_rate_grade: number
  datetime: string
  d: string
}

interface ForaSpO2HRRes {
  Message: string
  ReturnCode: number
  Data: ForaSpO2HRData[]
}

// ----- 活動分析 (mode=1) -----

interface ForaActivityParams {
  user_id: string
  start_dt: string
  end_dt: string
  mode: 1
}

interface ForaDietData {
  id: number
  date_time: string
  type: 1 | 2 | 3 | 4 | 5  // 1:早餐 2:午餐 3:晚餐 4:消夜 5:點心
  content: string
  calo: number
  summary: string  // JSON string
}

interface ForaStepData {
  duration: number
  time: string
  state: 0 | 1 | 2  // 0:日常走路 1:健走 2:跑步
}

interface ForaActivityData {
  step_date: string
  step_num: number
  calorie: [number, number]  // [基礎消耗, 活動消耗]
  weight: number
  height: number
  birth_year: number
  diet_data: ForaDietData[]
  step_data: ForaStepData[]
}

interface ForaActivityRes {
  Message: string
  ReturnCode: number
  Data: ForaActivityData[]
}

// ----- 睡眠分析 (mode=3) -----

interface ForaSleepParams {
  user_id: string
  start_dt: string
  end_dt: string
  mode: 3
}

interface ForaSleepData {
  meter_sn: string
  start_time: string
  end_time: string
  sleep_dur: string
  sleep_data: string       // JSON string array
  stage_summary: string    // JSON string
  sleep_score: string      // JSON string
  sleep_mvmt: string       // JSON string array
  stg_count: number
}

interface ForaSleepRes {
  Message: string
  ReturnCode: number
  Data: ForaSleepData[]
}

// ==================== iFORA O2 Web API ====================

type ForaLang = 'en' | 'tw'

// ----- 群組登入 -----

interface ForaGroupLoginParams {
  Acct: string
  Pwd: string
  Lang: ForaLang
}

interface ForaGroupLoginRes {
  ReturnCode: number
  Message?: string
  AccountId: string  // group_id
  Token: string
  MailAccount: string
  Name: string
}

// ----- 病患清單 -----

interface ForaGroupUserListParams {
  group_id: string
  user_join_status: 1 | 2  // 1:病患 2:授權
}

interface ForaGroupUserData {
  user_id: string
  email: string
  name?: string
  med_rec_no?: string
}

interface ForaGroupUserListRes {
  ReturnCode: number
  Message?: string
  Data: ForaGroupUserData[]
}

// ----- 使用者檔案 -----

interface ForaUserFileListParams {
  group_id: string
  user_id: string
  email: string
}

interface ForaUserFileData {
  Data: string           // 檔案資料 (ex: S201912251651,...)
  report_name: string    // 報告名稱
  email: string          // 用戶 email
  account_type?: number
  user_phone_time_offset?: number
}

interface ForaUserFileListRes {
  ReturnCode: number
  Message?: string
  Data: ForaUserFileData[]
}

// ----- 分析結果 -----

interface ForaAnalysisResultParams {
  user_id: string
  email: string
  filename: string
  mode: '1' | '2' | '5'  // 1:PDF 2:數據 5:筆記
  group_id: string
  Lang?: ForaLang
  is_delete?: '1'
}

interface ForaAnalysisResultRes {
  ReturnCode: number
  Message?: string
  resultData: string | string[]
}

// ----- 問答清單 -----

interface ForaQAListParams {
  group_id: string
}

interface ForaQAItem {
  question_id: number
  question_name: string
  question_content: string
  question_name_en: string
  question_content_en: string
}

interface ForaQAListRes {
  ReturnCode: number
  Message?: string
  Data: ForaQAItem[]
}
