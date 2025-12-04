<script setup lang="ts">
/**
 * FORA API 測試頁面
 * @description 用於測試 FORA Ring & iFORA O2 Web API
 * @see .windsurf/doc/FORA_API_DOCUMENTATION.md
 */

// ==================== 狀態 ====================

const loading = ref(false);
const activeTab = ref('web'); // web | ring (先登入再測試 Ring API)
const testResults = ref<any[]>([]);

// FORA Ring API 參數
const ringParams = reactive({
  userId: '',
  startDt: '',
  endDt: '',
});

// 病患清單
interface PatientInfo {
  user_id: string;
  email: string;
  name?: string;
  med_rec_no?: string;
}
const patientList = ref<PatientInfo[]>([]);
const selectedPatient = ref<PatientInfo | null>(null);
const loadingPatients = ref(false);

// iFORA O2 Web API 參數
const webParams = reactive({
  acct: 'gmkm21@gmail.com',
  pwd: '1qaz@WSX',
  lang: 'tw' as 'tw' | 'en',
});

// 登入狀態
const loginState = reactive({
  isLoggedIn: false,
  groupId: '',
  token: '',
  groupName: '',
});

// ==================== 測試方法 ====================

const addResult = (title: string, success: boolean, data: any, error?: string) => {
  testResults.value.unshift({
    id: Date.now(),
    title,
    success,
    data,
    error,
    time: new Date().toLocaleTimeString(),
  });
};

const clearResults = () => {
  testResults.value = [];
};

// ----- FORA Ring API 測試 -----

const testSpO2HR = async () => {
  loading.value = true;
  try {
    const res = await $api.GetSpO2HR({
      user_id: ringParams.userId,
      start_dt: ringParams.startDt,
      end_dt: ringParams.endDt,
      mode: 0,
    });
    addResult('血氧心率 (mode=0)', res.data?.ReturnCode === 0, res.data);
  } catch (err: any) {
    addResult('血氧心率 (mode=0)', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testActivity = async () => {
  loading.value = true;
  try {
    const res = await $api.GetActivity({
      user_id: ringParams.userId,
      start_dt: ringParams.startDt,
      end_dt: ringParams.endDt,
      mode: 1,
    });
    addResult('活動分析 (mode=1)', res.data?.ReturnCode === 0, res.data);
  } catch (err: any) {
    addResult('活動分析 (mode=1)', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testSleep = async () => {
  loading.value = true;
  try {
    const res = await $api.GetSleep({
      user_id: ringParams.userId,
      start_dt: ringParams.startDt,
      end_dt: ringParams.endDt,
      mode: 3,
    });
    addResult('睡眠分析 (mode=3)', res.data?.ReturnCode === 0, res.data);

    // 解析睡眠數據
    const sleepData = res.data?.Data?.[0];
    if (sleepData) {
      const stageSummary = $api.ParseStageSummary(sleepData.stage_summary);
      const sleepScore = $api.ParseSleepScore(sleepData.sleep_score);
      addResult('睡眠總覽解析', true, stageSummary);
      addResult('睡眠評分解析', true, sleepScore);
    }
  } catch (err: any) {
    addResult('睡眠分析 (mode=3)', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testAllRingApis = async () => {
  await testSpO2HR();
  await testActivity();
  await testSleep();
};

// ----- 病患選擇 -----

/** 獲取病患清單 */
const fetchPatientList = async () => {
  if (!loginState.isLoggedIn) {
    patientList.value = [];
    return;
  }

  loadingPatients.value = true;
  try {
    const res = await $api.GetGroupUserList({
      group_id: loginState.groupId,
      user_join_status: 1, // 病患
    });

    if (res.data?.ReturnCode === 0 && res.data?.Data) {
      patientList.value = res.data.Data;
      addResult('獲取病患清單', true, { count: res.data.Data.length });
    } else {
      patientList.value = [];
      addResult('獲取病患清單', false, res.data);
    }
  } catch (err: any) {
    patientList.value = [];
    addResult('獲取病患清單', false, null, err.message);
  } finally {
    loadingPatients.value = false;
  }
};

/** 選擇病患後帶入 User ID */
const onSelectPatient = (patient: PatientInfo | null) => {
  selectedPatient.value = patient;
  if (patient) {
    ringParams.userId = patient.user_id;
  } else {
    ringParams.userId = '';
  }
};

/** 格式化病患顯示名稱 */
const formatPatientLabel = (patient: PatientInfo) => {
  const parts = [];
  if (patient.name) parts.push(patient.name);
  if (patient.med_rec_no) parts.push(`病歷號: ${patient.med_rec_no}`);
  if (patient.email) parts.push(patient.email);
  return parts.join(' | ') || patient.user_id;
};

// ----- iFORA O2 Web API 測試 -----

const storeSelf = StoreSelf();

const testLogin = async () => {
  loading.value = true;
  try {
    const res = await $api.GroupLogin({
      Acct: webParams.acct,
      Pwd: webParams.pwd,
      Lang: webParams.lang,
    });

    const data = res.data;
    if (data?.ReturnCode === 0) {
      loginState.isLoggedIn = true;
      loginState.groupId = data.AccountId;
      loginState.token = data.Token;
      loginState.groupName = data.Name;
      
      // 存儲 Token 到 StoreSelf
      storeSelf.SetForaToken(data.Token, data.AccountId, data.Name);
      
      // 登入成功後自動獲取病患清單
      await fetchPatientList();
    }

    addResult('群組登入', data?.ReturnCode === 0, data);
  } catch (err: any) {
    addResult('群組登入', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testGetPatients = async () => {
  if (!loginState.isLoggedIn) {
    addResult('查詢病患清單', false, null, '請先登入');
    return;
  }

  loading.value = true;
  try {
    const res = await $api.GetGroupUserList({
      group_id: loginState.groupId,
      user_join_status: 1,
    });
    addResult('病患清單 (status=1)', res.data?.ReturnCode === 0, res.data);
  } catch (err: any) {
    addResult('病患清單 (status=1)', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testGetAuthorized = async () => {
  if (!loginState.isLoggedIn) {
    addResult('查詢授權清單', false, null, '請先登入');
    return;
  }

  loading.value = true;
  try {
    const res = await $api.GetGroupUserList({
      group_id: loginState.groupId,
      user_join_status: 2,
    });
    addResult('授權清單 (status=2)', res.data?.ReturnCode === 0, res.data);
  } catch (err: any) {
    addResult('授權清單 (status=2)', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const testGetQAList = async () => {
  if (!loginState.isLoggedIn) {
    addResult('查詢問答清單', false, null, '請先登入');
    return;
  }

  loading.value = true;
  try {
    const res = await $api.GetQAList({ group_id: loginState.groupId });
    addResult('問答清單', res.data?.ReturnCode === 0, res.data);
  } catch (err: any) {
    addResult('問答清單', false, null, err.message);
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  loginState.isLoggedIn = false;
  loginState.groupId = '';
  loginState.token = '';
  loginState.groupName = '';
  
  // 清除病患清單和選擇
  patientList.value = [];
  selectedPatient.value = null;
  
  // 清除 StoreSelf 中的 FORA token
  storeSelf.ForaSignOut();
  
  addResult('登出', true, { message: '已登出' });
};

// ==================== 初始化 ====================

// 設定預設日期 (今日)
onMounted(() => {
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  ringParams.startDt = `${formatDate(today)} 00:00:00`;
  ringParams.endDt = `${formatDate(today)} 23:59:59`;
});
</script>

<template lang="pug">
.fora-api-test
  //- Header
  .header
    h1 FORA API 測試工具
    el-button(type="danger" @click="clearResults" :disabled="testResults.length === 0")
      | 清除結果

  //- Tabs
  el-tabs(v-model="activeTab")
    //- iFORA O2 Web API (登入優先)
    el-tab-pane(label="iFORA O2 Web API" name="web")
      .form-section
        h3 登入參數
        el-form(label-width="100px")
          el-form-item(label="帳號")
            el-input(v-model="webParams.acct" placeholder="Email")
          el-form-item(label="密碼")
            el-input(v-model="webParams.pwd" type="password" placeholder="密碼")
          el-form-item(label="語言")
            el-radio-group(v-model="webParams.lang")
              el-radio(value="tw") 中文
              el-radio(value="en") 英文

        //- 登入狀態
        .login-status(v-if="loginState.isLoggedIn")
          el-alert(type="success" :closable="false")
            template(#title)
              | ✓ 已登入: {{ loginState.groupName }}
            | Group ID: {{ loginState.groupId }}

        h3 測試項目
        .button-group
          el-button(
            v-if="!loginState.isLoggedIn"
            type="primary"
            @click="testLogin"
            :loading="loading"
          ) 登入
          el-button(
            v-else
            type="warning"
            @click="logout"
          ) 登出

          el-button(
            type="primary"
            @click="testGetPatients"
            :loading="loading"
            :disabled="!loginState.isLoggedIn"
          ) 病患清單

          el-button(
            type="primary"
            @click="testGetAuthorized"
            :loading="loading"
            :disabled="!loginState.isLoggedIn"
          ) 授權清單

          el-button(
            type="primary"
            @click="testGetQAList"
            :loading="loading"
            :disabled="!loginState.isLoggedIn"
          ) 問答清單

    //- FORA Ring Client API
    el-tab-pane(label="FORA Ring API" name="ring")
      .form-section
        //- 病患選擇區域
        .patient-selector(v-if="loginState.isLoggedIn")
          h3 選擇病患
          el-alert(type="info" :closable="false" style="margin-bottom: 12px")
            template(#title)
              | 已登入: {{ loginState.groupName }}
            | 請選擇病患以帶入 User ID
          
          el-select(
            v-model="selectedPatient"
            value-key="user_id"
            placeholder="請選擇病患"
            clearable
            filterable
            :loading="loadingPatients"
            style="width: 100%"
            @change="onSelectPatient"
          )
            el-option(
              v-for="patient in patientList"
              :key="patient.user_id"
              :label="formatPatientLabel(patient)"
              :value="patient"
            )
              .patient-option
                span.patient-name {{ patient.name || '未命名' }}
                span.patient-info(v-if="patient.med_rec_no") 病歷號: {{ patient.med_rec_no }}
                span.patient-email {{ patient.email }}
          
          el-button(
            type="primary"
            :icon="'Refresh'"
            :loading="loadingPatients"
            @click="fetchPatientList"
            style="margin-top: 8px"
          ) 重新獲取病患清單
        
        //- 未登入提示
        el-alert(
          v-else
          type="warning"
          :closable="false"
          title="請先登入"
          description="請先到「iFORA O2 Web API」分頁登入，登入後會自動獲取病患清單"
          style="margin-bottom: 16px"
        )

        h3 請求參數
        el-form(label-width="100px")
          el-form-item(label="User ID")
            el-input(
              v-model="ringParams.userId"
              placeholder="使用者加密 ID (可從上方選擇病患自動帶入)"
              :disabled="!loginState.isLoggedIn"
            )
          el-form-item(label="開始時間")
            el-input(v-model="ringParams.startDt" placeholder="YYYY-MM-DD HH:mm:ss")
          el-form-item(label="結束時間")
            el-input(v-model="ringParams.endDt" placeholder="YYYY-MM-DD HH:mm:ss")

        h3 測試項目
        .button-group
          el-button(type="primary" @click="testSpO2HR" :loading="loading" :disabled="!ringParams.userId")
            | 血氧心率 (mode=0)
          el-button(type="primary" @click="testActivity" :loading="loading" :disabled="!ringParams.userId")
            | 活動分析 (mode=1)
          el-button(type="primary" @click="testSleep" :loading="loading" :disabled="!ringParams.userId")
            | 睡眠分析 (mode=3)
          el-button(type="success" @click="testAllRingApis" :loading="loading" :disabled="!ringParams.userId")
            | 全部測試

  //- 測試結果
  .results-section
    h2 測試結果 ({{ testResults.length }})
    .result-list(v-if="testResults.length > 0")
      .result-item(
        v-for="result in testResults"
        :key="result.id"
        :class="{ success: result.success, error: !result.success }"
      )
        .result-header
          span.result-title {{ result.title }}
          span.result-time {{ result.time }}
          el-tag(:type="result.success ? 'success' : 'danger'" size="small")
            | {{ result.success ? '成功' : '失敗' }}
        .result-body
          pre(v-if="result.data") {{ JSON.stringify(result.data, null, 2) }}
          .error-message(v-if="result.error") {{ result.error }}

    el-empty(v-else description="尚無測試結果")
</template>

<style scoped lang="scss">
.fora-api-test {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
  }
}

.form-section {
  padding: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 16px;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.login-status {
  margin-bottom: 20px;
}

.patient-selector {
  padding: 16px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 12px;
    color: var(--el-color-primary);
  }
}

.patient-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;

  .patient-name {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .patient-info {
    font-size: 12px;
    color: var(--el-color-primary);
  }

  .patient-email {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.results-section {
  h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;

  &.success {
    border-left: 4px solid var(--el-color-success);
  }

  &.error {
    border-left: 4px solid var(--el-color-danger);
  }
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);

  .result-title {
    font-weight: 600;
    flex: 1;
  }

  .result-time {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.result-body {
  padding: 12px 16px;

  pre {
    margin: 0;
    padding: 12px;
    background: var(--el-fill-color);
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
  }

  .error-message {
    color: var(--el-color-danger);
    font-weight: 500;
  }
}
</style>
