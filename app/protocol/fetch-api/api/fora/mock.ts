import * as mockRes from '@/protocol/fetch-api/mock-res';

// ==================== FORA Ring Client API ====================

/** 血氧心率 (mode=0) */
export const GetSpO2HR = () => {
  const data: ForaSpO2HRRes = {
    Message: 'SUCCESS',
    ReturnCode: 0,
    Data: [
      {
        meter_sn: '826612448000060f',
        spo2: 98.0,
        hr: 69.0,
        quality: 0,
        hear_rate_grade: 0,
        datetime: '2025-09-23 00:00:47',
        d: 'd',
      },
      {
        meter_sn: '826612448000060f',
        spo2: 97.0,
        hr: 72.0,
        quality: 0,
        hear_rate_grade: 0,
        datetime: '2025-09-23 00:03:54',
        d: 'd',
      },
    ],
  };
  return mockRes.CreateRes(data);
};

/** 活動分析 (mode=1) */
export const GetActivity = () => {
  const data: ForaActivityRes = {
    Message: 'SUCCESS',
    ReturnCode: 0,
    Data: [
      {
        step_date: '2025-09-23',
        step_num: 1678,
        calorie: [1168.17, 249.05],
        weight: 53.0,
        height: 154,
        birth_year: 1991,
        diet_data: [
          {
            id: 3493,
            date_time: '2025-09-23 12:00:00',
            type: 2,
            content: '日式經典便當',
            calo: 880,
            summary: '[40,95,35,2,1,2,0,0,0]',
          },
        ],
        step_data: [
          { duration: 111, time: '22:00:00', state: 0 },
          { duration: 27, time: '20:52:00', state: 1 },
        ],
      },
    ],
  };
  return mockRes.CreateRes(data);
};

/** 睡眠分析 (mode=3) */
export const GetSleep = () => {
  const data: ForaSleepRes = {
    Message: 'SUCCESS',
    ReturnCode: 0,
    Data: [
      {
        meter_sn: '826612448000060f',
        start_time: '2025-09-23 00:34:18',
        end_time: '2025-09-23 07:32:28',
        sleep_dur: '7hr 0min',
        sleep_data: '["1,1,1,1,1,0,0,0","1,1,2,2,2,0,0,0"]',
        stage_summary: '[420.0, 0.283, 0.388, 0.295, 0.021, 0.021]',
        sleep_score: '[83.0, 0.0, 0.0, 0.571, 1.0, -0.952, 0.036, 0.0, 0.08]',
        sleep_mvmt: '["0.01,00:34:19","0.01,00:35:16"]',
        stg_count: 0,
      },
    ],
  };
  return mockRes.CreateRes(data);
};

// ==================== iFORA O2 Web API ====================

/** 群組登入 */
export const GroupLogin = () => {
  const data: ForaGroupLoginRes = {
    ReturnCode: 0,
    AccountId: 'tUBZRBUlqbHEb1ArQbUGNw==',
    MailAccount: 'test@example.com',
    Name: '測試群組',
    Token: '2d82d222a13646f79e6a86e8772d6185',
    Message: '登入成功',
  };
  return mockRes.CreateRes(data);
};

/** 病患/授權清單 */
export const GetGroupUserList = () => {
  const data: ForaGroupUserListRes = {
    ReturnCode: 0,
    Data: [
      { user_id: 'user001==', email: 'patient1@example.com', name: '測試病患1' },
      { user_id: 'user002==', email: 'patient2@example.com', name: '測試病患2' },
    ],
  };
  return mockRes.CreateRes(data);
};

/** 使用者檔案清單 */
export const GetUserFileList = () => {
  const data: ForaUserFileListRes = {
    ReturnCode: 0,
    Data: [
      {
        // 睡眠報告 (S 開頭) - 支援 PDF
        Data: 'S202501011200,165105,165132,96.0,0.0,0.0,0.0,28,96.1,測試用戶,0.00',
        report_name: '測試用戶',
        email: 'test@example.com',
        account_type: 0,
        user_phone_time_offset: 0,
      },
      {
        // HRV 自律神經報告 (H 開頭) - 不支援 PDF
        Data: 'H202501011300,hrv數據...',
        report_name: '測試用戶',
        email: 'test@example.com',
        account_type: 0,
        user_phone_time_offset: 0,
      },
      {
        // BHRV 共振呼吸報告 (B 開頭) - 不支援 PDF
        Data: 'B202501011400,84.1456,0.5136,0.445,測試用戶',
        report_name: '測試用戶',
        email: 'test@example.com',
        account_type: 0,
        user_phone_time_offset: 0,
      },
    ],
  };
  return mockRes.CreateRes(data);
};

/** 分析結果 */
export const GetAnalysisResult = () => {
  const data: ForaAnalysisResultRes = {
    ReturnCode: 0,
    resultData: 'SafeFile/7705b6eeeabed085f027e5fd4e695647',
  };
  return mockRes.CreateRes(data);
};

/** 問答清單 */
export const GetQAList = () => {
  const data: ForaQAListRes = {
    ReturnCode: 0,
    Data: [
      {
        question_id: 1,
        question_name: '配戴呼吸器',
        question_content: '無, 1號, 2號, 3號',
        question_name_en: 'Use CPAP',
        question_content_en: 'No, No. 1, No. 2, No. 3',
      },
      {
        question_id: 2,
        question_name: '口內輔助',
        question_content: '無, 牙套, 舌套, 口膠帶',
        question_name_en: 'Intraoral Device',
        question_content_en: 'No, MAD, TSD, mouth tape',
      },
    ],
  };
  return mockRes.CreateRes(data);
};
