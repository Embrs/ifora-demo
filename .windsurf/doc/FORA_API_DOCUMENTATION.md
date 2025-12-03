# FORA Ring & iFORA O2 Web API 開發文件

> 整理自官方文件：FORA Ring API For Client (2025/09/26) 及 iForaO2WebAPI v1.4 (2020/05/05)

---

## 專案使用方式

### API 模組結構

```
app/protocol/fetch-api/api/fora/
├── index.ts     # API 服務函式
├── mock.ts      # Mock 測試數據
└── type.d.ts    # 全域型別定義
```

### 使用方式

**在元件中使用 `$api` (推薦)**

```vue
<script setup lang="ts">
// 直接使用全域 $api (由 Nuxt auto-import)
const res = await $api.GetSpO2HR({
  user_id: 'xxx',
  start_dt: '2025-01-01 00:00:00',
  end_dt: '2025-01-01 23:59:59',
  mode: 0,
});

// 回應結構
if (res.data?.ReturnCode === 0) {
  console.log(res.data.Data);
}
```

### 可用 API 函式

| 函式名稱 | 說明 |
|---------|------|
| `$api.GetSpO2HR(params)` | 血氧心率 (mode=0) |
| `$api.GetActivity(params)` | 活動分析 (mode=1) |
| `$api.GetSleep(params)` | 睡眠分析 (mode=3) |
| `$api.GroupLogin(params)` | 群組登入 |
| `$api.GetGroupUserList(params)` | 病患/授權清單 |
| `$api.GetUserFileList(params)` | 使用者檔案清單 |
| `$api.GetAnalysisResult(params)` | 分析結果 |
| `$api.GetQAList(params)` | 問答清單 |

### 工具函式

| 函式名稱 | 說明 |
|---------|------|
| `$api.GetSleepPdfUrl(resultData, filename, lang)` | 組合睡眠 PDF URL |
| `$api.ParseStageSummary(stageSummary)` | 解析睡眠總覽 |
| `$api.ParseSleepScore(sleepScore)` | 解析睡眠評分 |
| `$api.ParseHRVData(resultData)` | 解析 HRV 數據 |
| `$api.ParseBHRVData(resultData)` | 解析 BHRV 數據 |

### Mock 模式

在 `.env` 設定 `testMode=T` 開啟 Mock 模式，API 會回傳測試數據。

---

## 目錄

1. [概述](#概述)
2. [加密機制](#加密機制)
3. [FORA Ring Client API](#fora-ring-client-api)
   - [全日血氧心率 (mode=0)](#1-全日血氧心率-mode0)
   - [活動分析 (mode=1)](#2-活動分析-mode1)
   - [睡眠分期分析 (mode=3)](#3-睡眠分期分析-mode3)
4. [iFORA O2 Web API (群組管理)](#ifora-o2-web-api-群組管理)
   - [CreateGroupAES - 群組註冊](#1-creategroupaes---群組註冊)
   - [GroupLoginAES - 群組登入](#2-grouploginaes---群組登入)
   - [QryGroupFileListO2WebAES - 照護總覽](#3-qrygroupfilelisto2webaes---照護總覽)
   - [QryGroupUserListO2WebAES - 病患清單](#4-qrygroupuserlisto2webaes---病患清單)
   - [JoinGroupO2WebAES - 加入群組](#5-joingroupo2webaes---加入群組)
   - [QryUserFileListO2WebAES - 使用者檔案清單](#6-qryuserfilelisto2webaes---使用者檔案清單)
   - [AnalysisResultO2WebAES - 分析結果](#7-analysisresulto2webaes---分析結果)
   - [QueryQAListO2WebAES - 問答清單](#8-queryqalisto2webaes---問答清單)
5. [錯誤碼說明](#錯誤碼說明)
6. [TypeScript 型別定義](#typescript-型別定義)

---

## 概述

本文件涵蓋兩套 API：

| API 系統 | 用途 | Base URL |
|---------|------|----------|
| **FORA Ring Client API** | 智慧戒指數據查詢（血氧、心率、睡眠、活動） | `https://www.foracare.live/ForaO2API/` |
| **iFORA O2 Web API** | 照護機構群組管理 | `https://www.foracare.live/` |

---

## 加密機制

所有 API 使用 **AES-128-ECB** 加密：

```typescript
// 加密設定
const AES_KEY = new Uint8Array([
  0x31, 0x26, 0x64, 0x23, 0x15, 0x62, 0x46, 0x09,
  0x74, 0x23, 0x26
]);

// 演算法：AES-128-ECB
// Padding：ZeroPadding
// IV：無
```

---

## FORA Ring Client API

### 基本資訊

| 項目 | 值 |
|-----|---|
| **Base URL** | `https://www.foracare.live/ForaO2API/ClientRingDataAES` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### 通用請求參數

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `user_id` | string | ✅ | 使用者加密 ID |
| `start_dt` | string | ✅ | 開始時間 `YYYY-MM-DD HH:mm:ss` |
| `end_dt` | string | ✅ | 結束時間 `YYYY-MM-DD HH:mm:ss` |
| `mode` | number | ✅ | 功能模式 (0/1/3) |

### 通用回應格式

```typescript
interface BaseResponse<T> {
  Message: string;      // 狀態說明
  ReturnCode: number;   // 0: 成功
  Data: T[];            // 資料陣列
}
```

---

### 1. 全日血氧心率 (mode=0)

查詢指定時間範圍內的血氧和心率數據。

#### 請求範例

```json
{
  "user_id": "27c2d65ed4df32c1ce5609deddc97007",
  "start_dt": "2025-09-23 00:00:00",
  "end_dt": "2025-09-23 23:59:59",
  "mode": 0
}
```

#### 回應參數

| 參數 | 類型 | 說明 |
|-----|------|------|
| `meter_sn` | string | 裝置序號 |
| `spo2` | number | 血氧值 (%) |
| `hr` | number | 心率值 (bpm) |
| `quality` | number | 內部使用 |
| `hear_rate_grade` | number | 內部使用 |
| `datetime` | string | 時間 `YYYY-MM-DD HH:mm:ss` |
| `d` | string | 內部使用 |

#### 回應範例

```json
{
  "Message": "SUCCESS",
  "Data": [
    {
      "meter_sn": "826612448000060f",
      "spo2": 98.0,
      "hr": 69.0,
      "quality": 0,
      "hear_rate_grade": 0,
      "datetime": "2025-09-23 00:00:47",
      "d": "d"
    }
  ],
  "ReturnCode": 0
}
```

---

### 2. 活動分析 (mode=1)

查詢活動數據，包含步數、卡路里、飲食紀錄。

#### 請求範例

```json
{
  "user_id": "27c2d65ed4df32c1ce5609deddc97007",
  "start_dt": "2025-09-23 00:00:00",
  "end_dt": "2025-09-23 23:59:59",
  "mode": 1
}
```

#### 回應參數

| 參數 | 類型 | 說明 |
|-----|------|------|
| `step_date` | string | 日期 |
| `step_num` | number | 總步數 |
| `calorie` | number[] | `[基礎消耗, 活動消耗]` |
| `weight` | number | 體重 (kg) |
| `height` | number | 身高 (cm) |
| `birth_year` | number | 出生年 (西元) |
| `diet_data` | DietData[] | 飲食資料陣列 |
| `step_data` | StepData[] | 步數資料陣列 |

##### DietData 結構

| 參數 | 類型 | 說明 |
|-----|------|------|
| `id` | number | 飲食資料 ID |
| `date_time` | string | 日期時間 |
| `type` | number | 1:早餐, 2:午餐, 3:晚餐, 4:消夜, 5:點心 |
| `content` | string | 餐點描述 |
| `calo` | number | 卡路里 |
| `summary` | string | 營養資訊 JSON 字串 `[蛋白質g, 醣類g, 脂質g, 豆魚蛋肉類份, 全榖雜糧類份, 蔬菜類份, 油脂堅果份, 水果類份, 乳品類份]` |

##### StepData 結構

| 參數 | 類型 | 說明 |
|-----|------|------|
| `duration` | number | 步數/運動時間 |
| `time` | string | 時間 |
| `state` | number | 0:日常走路, 1:健走, 2:跑步 |

#### 回應範例

```json
{
  "Message": "SUCCESS",
  "Data": [
    {
      "step_date": "2025-09-23",
      "step_num": 1678,
      "calorie": [1168.17, 249.05],
      "weight": 53.0,
      "height": 154,
      "birth_year": 1991,
      "diet_data": [
        {
          "id": 3493,
          "date_time": "2025-09-23 00:00:00",
          "type": 2,
          "content": "日式經典便當",
          "calo": 880,
          "summary": "[40,95,35,2,1,2,0,0,0]"
        }
      ],
      "step_data": [
        { "duration": 111, "time": "22:00:00", "state": 0 },
        { "duration": 27, "time": "20:52:00", "state": 1 }
      ]
    }
  ],
  "ReturnCode": 0
}
```

---

### 3. 睡眠分期分析 (mode=3)

查詢睡眠分期和睡眠品質評估。

#### 請求範例

```json
{
  "user_id": "27c2d65ed4df32c1ce5609deddc97007",
  "start_dt": "2025-09-23 00:00:00",
  "end_dt": "2025-09-23 23:59:59",
  "mode": 3
}
```

#### 回應參數

| 參數 | 類型 | 說明 |
|-----|------|------|
| `meter_sn` | string | 裝置序號 |
| `start_time` | string | 睡眠開始時間 |
| `end_time` | string | 睡眠結束時間 |
| `sleep_dur` | string | 睡眠時長 (e.g., "7hr 0min") |
| `sleep_data` | string | 睡眠分期資料 (JSON 字串陣列) |
| `stage_summary` | string | 睡眠總覽 (JSON 字串) |
| `sleep_score` | string | 睡眠評估 (JSON 字串) |
| `sleep_mvmt` | string | 睡眠體動資料 (JSON 字串) |
| `stg_count` | number | 內部使用 |

##### sleep_data 格式

每 5 分鐘為一筆，格式：`["分鐘1,分鐘2,分鐘3,分鐘4,分鐘5,保留,保留,保留", ...]`

**睡眠階段代碼：**
| 代碼 | 階段 |
|-----|------|
| 0 | deep (深睡) |
| 1 | light (淺睡) |
| 2 | rem (快速動眼) |
| 3 | awake (清醒) |

##### stage_summary 格式

`[總分鐘數, 深睡比例, 淺睡比例, 快速動眼比例, 清醒比例, 清醒比例]`

##### sleep_score 格式

`[睡眠得分, 總時間評分, 深睡評分, 清醒比例評分, 身體安靜度評分, 淺睡+深睡比例評分, 身體躁動指數, 身體躁動評分, 呼吸中止評估]`

##### sleep_mvmt 格式

`["翻動幅度,時間", ...]`

#### 回應範例

```json
{
  "Message": "SUCCESS",
  "Data": [
    {
      "meter_sn": "826612448000060f",
      "start_time": "2025-09-23 00:34:18",
      "end_time": "2025-09-23 07:32:28",
      "sleep_dur": "7hr 0min",
      "sleep_data": "[\"1,1,1,1,1,0,0,0\",\"1,1,2,2,2,0,0,0\"]",
      "stage_summary": "[420.0, 0.283, 0.388, 0.295, 0.021, 0.021]",
      "sleep_score": "[83.0, 0.0, 0.0, 0.571, 1.0, -0.952, 0.036, 0.0, 0.08]",
      "sleep_mvmt": "[\"0.01,00:34:19\",\"0.01,00:35:16\"]",
      "stg_count": 0
    }
  ],
  "ReturnCode": 0
}
```

---

## iFORA O2 Web API (群組管理)

### API 使用流程

```
1. CreateGroupAES (註冊)
       ↓
2. GroupLoginAES (登入) → 取得 AccountId + Token
       ↓
3. QryGroupFileListO2WebAES (照護總覽)
       ↓
4. QryGroupUserListO2WebAES (病患清單)
       ↓
5. JoinGroupO2WebAES (加入/管理群組成員)
       ↓
6. QryUserFileListO2WebAES (單一病患資料)
       ↓
7. AnalysisResultO2WebAES (睡眠/HRV/BHRV 分析)
       ↓
8. QueryQAListO2WebAES (問答清單)
```

---

### 1. CreateGroupAES - 群組註冊

#### 請求

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `Acct` | string | ✅ | Email 格式 |
| `Pwd` | string | ✅ | 密碼 |
| `Name` | string | ✅ | 群組名稱 |
| `public` | number | ✅ | 0 |
| `join_code` | string | ✅ | 群組代碼 |
| `Lang` | string | ✅ | `en`=英文, `tw`=中文 |
| `GMAcct` | string | ✅ | 群組管理者帳號 |
| `GMPwd` | string | ✅ | 群組管理者密碼 |

#### 回應

| 參數 | 類型 | 說明 |
|-----|------|------|
| `ReturnCode` | number | 0=成功, 1=失敗 |
| `AccountId` | string | 帳號 ID |
| `MailAccount` | string | Email |
| `MailState` | number | 0=註冊成功,信箱未驗證 |
| `Message` | string | 訊息 |

#### 回應範例

```json
// 成功
{
  "ReturnCode": 0,
  "AccountId": "jgG9dI3yi+PKA11on1XaHA==",
  "MailAccount": "foraClinic001@gmail.com",
  "Message": "",
  "MailState": 0
}

// 失敗
{ "ReturnCode": 1, "Message": "Group帳號密碼輸入錯誤" }
{ "ReturnCode": 1, "Message": "Account registered" }
{ "ReturnCode": 1, "Message": "Join code registered" }
```

---

### 2. GroupLoginAES - 群組登入

#### 請求

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `Acct` | string | ✅ | Email 格式 |
| `Pwd` | string | ✅ | 密碼 |
| `Lang` | string | ✅ | `en`=英文, `tw`=中文 |

#### 回應

| 參數 | 類型 | 說明 |
|-----|------|------|
| `ReturnCode` | number | 0=成功, 1=失敗 |
| `AccountId` | string | 等於 group_id，供其他 API 使用 |
| `Token` | string | 認證 Token，供其他 API 使用 |
| `MailAccount` | string | Email |
| `Name` | string | 群組名稱 |
| `Message` | string | 訊息 |

#### 回應範例

```json
// 成功
{
  "ReturnCode": 0,
  "AccountId": "tUBZRBUlqbHEb1ArQbUGNw==",
  "MailAccount": "fora_test01@taidoc.com.tw",
  "Name": "福爾",
  "Token": "2d82d222a13646f79e6a86e8772d6185",
  "Message": "登入成功"
}

// 失敗
{ "ReturnCode": 1, "Message": "帳號或密碼錯誤！" }
```

---

### 3. QryGroupFileListO2WebAES - 照護總覽

> 需要認證 Header: `Authorization: Bearer {Token}`

#### 請求 (Body)

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `group_id` | string | ✅ | 登入取得的 AccountId |

#### 回應

| 參數 | 類型 | 說明 |
|-----|------|------|
| `ReturnCode` | number | 0=成功, 1=失敗, 1099=token 過期 |
| `Data` | object[] | 照護資料陣列 |

---

### 4. QryGroupUserListO2WebAES - 病患清單

> 需要認證 Header: `Authorization: Bearer {Token}`

#### 請求 (Body)

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `group_id` | string | ✅ | 登入取得的 AccountId |
| `user_join_status` | number | ✅ | 1=病患清單, 2=使用者授權清單 |

#### 回應

| 參數 | 類型 | 說明 |
|-----|------|------|
| `ReturnCode` | number | 0=成功, 1=失敗, 1099=token 過期 |
| `Data` | object[] | 使用者資料陣列 |

---

### 5. JoinGroupO2WebAES - 加入群組

> 需要認證 Header: `Authorization: Bearer {Token}`

#### 請求 (Body)

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `group_id` | string | ✅ | 登入取得的 AccountId |
| `user_id` | string | ✅ | 使用者 ID |
| `user_join_status` | number | ✅ | 1=加入並輸入病例號, 2=移除 |
| `med_rec_no` | string | 條件 | user_join_status=1 時必填，病例號 |

---

### 6. QryUserFileListO2WebAES - 使用者檔案清單

> 需要認證 Header: `Authorization: Bearer {Token}`

#### 請求 (Body)

| 參數 | 類型 | 必填 | 說明 |
|-----|------|-----|------|
| `group_id` | string | ✅ | 登入取得的 AccountId |
| `user_id` | string | ✅ | 使用者 ID |
| `email` | string | ✅ | 使用者 Email |

---

### 7. AnalysisResultO2WebAES - 分析結果

> 需要認證 Header: `Authorization: Bearer {Token}`

根據 `filename` 前綴和 `mode` 參數取得不同類型的分析結果：

#### Filename 前綴說明

| 前綴 | 類型 | mode |
|-----|------|------|
| `S` | 睡眠 PDF | 1 |
| `H` | HRV 自律神經 | 2 |
| `B` | BHRV 共振呼吸 | 2 |
| `NS` | 睡眠筆記 | 5 |
| `NH` | HRV 筆記 | 5 |
| `NB` | BHRV 筆記 | 5 |

#### 7-1. 睡眠 PDF (mode=1)

**請求**

```json
{
  "user_id": "Aqoqwn5TUFUQ22ckFVz8Lw==",
  "email": "foraTest01@hotmail.com",
  "filename": "S202001311702",
  "mode": "1",
  "is_delete": "1",
  "Lang": "en",
  "group_id": "tUB2RBUlqbHEb1ArQbUGNw=="
}
```

**回應**

```json
{
  "ReturnCode": 0,
  "resultData": "SafeFile/7705b6eeeabed085f027e5fd4e695647"
}
```

**PDF URL 組合**
- 中文：`https://www.foracare.live/{resultData}/{filename}_tw.png`
- 英文：`https://www.foracare.live/{resultData}/{filename}_en.png`

#### 7-2. HRV 自律神經 (mode=2, filename 開頭 H)

**請求**

```json
{
  "user_id": "4ZJ7/76LdsHI9nYc+11Lh5yQ==",
  "email": "foraTest01@gmail.com",
  "filename": "H202001021757",
  "mode": "2",
  "group_id": "tUBZRBUlqbHEbdarQbUGNw=="
}
```

**resultData 欄位說明 (位置索引)**

| 位置 | 名稱 | 單位 |
|-----|------|------|
| 12 | 心律 | bpm |
| 0 | 自律神經總活性 (SDNN) | ms |
| 5 | 交感 (LF) | ms² |
| 6 | 副交感 (HF) | ms² |
| 9 | 交感副交感比 (LF/HF) | - |

#### 7-3. BHRV 共振呼吸 (mode=2, filename 開頭 B)

**resultData 欄位說明 (位置索引)**

| 位置 | 名稱 | 單位 |
|-----|------|------|
| 19 | 量測時間 | 3/5 min |
| 12 | 心律 | bpm |
| 13 | 同步性 (Cohr) | % |
| 14 | 共振性 (Reso) | % |
| 17 | 呼吸頻率 (Breath rate) | bpm |

#### 7-4. 筆記內容 (mode=5)

**請求**

```json
{
  "user_id": "4ZJ7/76Li2HI9nYc+Lh5yR==",
  "email": "foraTest01@gmail.com",
  "filename": "NS202001311638",
  "mode": "5",
  "Lang": "en",
  "group_id": "tUBZRBUlqbHEb2ArQbUGNw=="
}
```

**回應格式**

- **Sleep**: `["1:-1, 2:1, 3:-1, 4:2, ...", "row1", "row2"]`
  - 第一項：題目:答案 (-1=未填寫, 0=答案1, 1=答案2, ...)
  - 其餘：筆記內容
- **HRV/BHRV**: `["row1", "row2", "row3"]` (筆記內容)

---

### 8. QueryQAListO2WebAES - 問答清單

> 需要認證 Header: `Authorization: Bearer {Token}`

#### 請求 (Body)

```json
{
  "group_id": "tUB2RBUlqbHEb1ArQbUGNw=="
}
```

#### 回應

```json
{
  "ReturnCode": 0,
  "Data": [
    {
      "question_id": 1,
      "question_name": "配戴呼吸器",
      "question_content": "無, 1號, 2號, 3號",
      "question_name_en": "Use CPAP",
      "question_content_en": "No, No. 1, No. 2, No. 3"
    },
    {
      "question_id": 2,
      "question_name": "口內輔助",
      "question_content": "無, 牙套, 舌套, 口膠帶",
      "question_name_en": "Intraoral Device",
      "question_content_en": "No, MAD, TSD, mouth tape"
    }
  ]
}
```

---

## 錯誤碼說明

| ReturnCode | 說明 |
|------------|------|
| 0 | 成功 |
| 1 | 失敗 (一般錯誤) |
| 2 | 檔名不存在 |
| 3 | EX檔不存在 |
| 1099 | Token 超過有效期限 |

---

## TypeScript 型別定義

```typescript
// ==================== 通用型別 ====================

interface BaseResponse<T = any> {
  ReturnCode: number;
  Message?: string;
  Data?: T;
}

// ==================== FORA Ring Client API ====================

/** 血氧心率查詢請求 */
interface SpO2HRRequest {
  user_id: string;
  start_dt: string;  // YYYY-MM-DD HH:mm:ss
  end_dt: string;    // YYYY-MM-DD HH:mm:ss
  mode: 0;
}

/** 血氧心率資料 */
interface SpO2HRData {
  meter_sn: string;
  spo2: number;
  hr: number;
  quality: number;
  hear_rate_grade: number;
  datetime: string;
  d: string;
}

/** 活動分析請求 */
interface ActivityRequest {
  user_id: string;
  start_dt: string;
  end_dt: string;
  mode: 1;
}

/** 飲食資料 */
interface DietData {
  id: number;
  date_time: string;
  type: 1 | 2 | 3 | 4 | 5;  // 1:早餐, 2:午餐, 3:晚餐, 4:消夜, 5:點心
  content: string;
  calo: number;
  summary: string;  // JSON string: [蛋白質, 醣類, 脂質, ...]
}

/** 步數資料 */
interface StepData {
  duration: number;
  time: string;
  state: 0 | 1 | 2;  // 0:日常走路, 1:健走, 2:跑步
}

/** 活動分析資料 */
interface ActivityData {
  step_date: string;
  step_num: number;
  calorie: [number, number];  // [基礎消耗, 活動消耗]
  weight: number;
  height: number;
  birth_year: number;
  diet_data: DietData[];
  step_data: StepData[];
}

/** 睡眠分析請求 */
interface SleepRequest {
  user_id: string;
  start_dt: string;
  end_dt: string;
  mode: 3;
}

/** 睡眠階段 */
type SleepStage = 0 | 1 | 2 | 3;  // 0:deep, 1:light, 2:rem, 3:awake

/** 睡眠分析資料 */
interface SleepData {
  meter_sn: string;
  start_time: string;
  end_time: string;
  sleep_dur: string;
  sleep_data: string;      // JSON string array
  stage_summary: string;   // JSON string: [總分鐘, 深睡比, 淺睡比, REM比, 清醒比, 清醒比]
  sleep_score: string;     // JSON string: [得分, 總時間評分, 深睡評分, ...]
  sleep_mvmt: string;      // JSON string array: ["幅度,時間", ...]
  stg_count: number;
}

// ==================== iFORA O2 Web API ====================

/** 群組登入請求 */
interface GroupLoginRequest {
  Acct: string;
  Pwd: string;
  Lang: 'en' | 'tw';
}

/** 群組登入回應 */
interface GroupLoginResponse extends BaseResponse {
  AccountId: string;
  Token: string;
  MailAccount: string;
  Name: string;
}

/** 需要認證的請求 Header */
interface AuthHeader {
  Authorization: `Bearer ${string}`;
}

/** 分析結果請求 */
interface AnalysisResultRequest {
  user_id: string;
  email: string;
  filename: string;
  mode: '1' | '2' | '5';
  group_id: string;
  Lang?: 'en' | 'tw';
  is_delete?: '1';
}

/** 分析結果回應 */
interface AnalysisResultResponse extends BaseResponse {
  resultData: string | string[];
}

/** 問答項目 */
interface QAItem {
  question_id: number;
  question_name: string;
  question_content: string;
  question_name_en: string;
  question_content_en: string;
}
```

---

## 使用範例

### 1. 查詢血氧心率

```typescript
async function fetchSpO2HR(userId: string, startDt: string, endDt: string) {
  const response = await fetch('https://www.foracare.live/ForaO2API/ClientRingDataAES', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      start_dt: startDt,
      end_dt: endDt,
      mode: 0
    })
  });
  return response.json();
}
```

### 2. 群組登入並查詢病患清單

```typescript
async function loginAndGetPatients() {
  // 登入
  const loginRes = await fetch('https://www.foracare.live/GroupLoginAES', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Acct: 'clinic@example.com',
      Pwd: 'password123',
      Lang: 'tw'
    })
  });
  const { AccountId, Token } = await loginRes.json();

  // 查詢病患清單
  const patientsRes = await fetch('https://www.foracare.live/QryGroupUserListO2WebAES', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Token}`
    },
    body: JSON.stringify({
      group_id: AccountId,
      user_join_status: 1
    })
  });
  return patientsRes.json();
}
```

---

> **注意事項**
> 1. 所有 API 請求需使用 AES-128-ECB 加密
> 2. Token 有有效期限，過期會收到 ReturnCode: 1099
> 3. 日期時間格式統一為 `YYYY-MM-DD HH:mm:ss`
