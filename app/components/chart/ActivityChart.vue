<script setup lang="ts">
/**
 * 活動分析圖表組件
 * @description 顯示步數、卡路里等活動數據，增強統計顯示
 */
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
]);

// Props
interface StepData {
  duration: number;
  time: string;
  state: number; // 0:日常走路, 1:健走, 2:跑步
}

interface DietData {
  id: number;
  date_time: string;
  type: number; // 1:早餐, 2:午餐, 3:晚餐, 4:消夜, 5:點心
  content: string;
  calo: number;
  summary: string;
}

interface ActivityData {
  step_date: string;
  step_num: number;
  calorie: [number, number]; // [基礎消耗, 活動消耗]
  weight: number;
  height: number;
  birth_year: number;
  diet_data: DietData[];
  step_data: StepData[];
}

const props = defineProps<{
  data: ActivityData[];
  title?: string;
}>();

// 活動總覽統計
const activitySummary = computed(() => {
  if (!props.data?.length) return null;

  const totalSteps = props.data.reduce((sum, d) => sum + (d.step_num || 0), 0);
  const avgSteps = Math.round(totalSteps / props.data.length);
  const maxSteps = Math.max(...props.data.map((d) => d.step_num || 0));
  const minSteps = Math.min(...props.data.filter((d) => d.step_num > 0).map((d) => d.step_num));

  const totalBasal = props.data.reduce((sum, d) => sum + (d.calorie?.[0] || 0), 0);
  const totalActive = props.data.reduce((sum, d) => sum + (d.calorie?.[1] || 0), 0);
  const totalCalories = totalBasal + totalActive;

  // 達標天數 (假設目標為 8000 步)
  const targetSteps = 8000;
  const achievedDays = props.data.filter((d) => d.step_num >= targetSteps).length;

  return {
    totalSteps,
    avgSteps,
    maxSteps,
    minSteps: minSteps === Infinity ? 0 : minSteps,
    totalCalories: Math.round(totalCalories),
    totalBasal: Math.round(totalBasal),
    totalActive: Math.round(totalActive),
    achievedDays,
    totalDays: props.data.length,
    achievedPercent: ((achievedDays / props.data.length) * 100).toFixed(0),
  };
});

// 步數詳細統計
const stepStats = computed(() => {
  if (!props.data?.length) return null;

  const allStepData = props.data.flatMap((d) => d.step_data || []);
  const walking = allStepData.filter((s) => s.state === 0).reduce((sum, s) => sum + s.duration, 0);
  const briskWalk = allStepData.filter((s) => s.state === 1).reduce((sum, s) => sum + s.duration, 0);
  const running = allStepData.filter((s) => s.state === 2).reduce((sum, s) => sum + s.duration, 0);
  const totalMinutes = walking + briskWalk + running;

  return {
    walking,
    briskWalk,
    running,
    totalMinutes,
    walkingPercent: totalMinutes > 0 ? ((walking / totalMinutes) * 100).toFixed(0) : '0',
    briskWalkPercent: totalMinutes > 0 ? ((briskWalk / totalMinutes) * 100).toFixed(0) : '0',
    runningPercent: totalMinutes > 0 ? ((running / totalMinutes) * 100).toFixed(0) : '0',
  };
});

// 格式化數字
const formatNumber = (num: number) => num?.toLocaleString() || '0';

// 步數目標等級
const getStepLevel = (steps: number) => {
  if (steps >= 10000) return { label: '優秀', type: 'success' as const };
  if (steps >= 8000) return { label: '達標', type: 'primary' as const };
  if (steps >= 5000) return { label: '一般', type: 'warning' as const };
  return { label: '不足', type: 'danger' as const };
};

// 步數圖表配置
const stepChartOption = computed(() => {
  if (!props.data?.length) return {};

  const dates = props.data.map((d) => d.step_date?.slice(5) || d.step_date);
  const steps = props.data.map((d) => d.step_num || 0);

  return {
    title: {
      text: '每日步數',
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#303133' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const steps = params[0].value || 0;
        const level = getStepLevel(steps);
        return `
          <div style="font-weight: 600; margin-bottom: 6px;">${params[0].name}</div>
          <div style="color: #409eff;">🚶 步數: <strong>${formatNumber(steps)}</strong>
            <span style="color: ${level.type === 'success' ? '#67c23a' : level.type === 'primary' ? '#409eff' : level.type === 'warning' ? '#e6a23c' : '#f56c6c'};">(${level.label})</span>
          </div>
        `;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '18%', containLabel: true },
    xAxis: {
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontSize: 11 },
    },
    yAxis: {
      type: 'value', name: '步數',
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'bar', data: steps, barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (params: any) => {
          const val = params.value || 0;
          if (val >= 10000) return '#67c23a';
          if (val >= 8000) return '#409eff';
          if (val >= 5000) return '#e6a23c';
          return '#f56c6c';
        },
      },
      label: {
        show: props.data.length <= 7,
        position: 'top',
        formatter: (params: any) => formatNumber(params.value),
        color: '#606266', fontSize: 10,
      },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { type: 'dashed', width: 1 },
        label: { position: 'insideEndTop', fontSize: 10 },
        data: [
          { yAxis: 8000, lineStyle: { color: '#409eff' }, label: { formatter: '目標 8000', color: '#409eff' } },
          { yAxis: 10000, lineStyle: { color: '#67c23a' }, label: { formatter: '10000', color: '#67c23a' } },
        ],
      },
    }],
  };
});

// 卡路里堆疊條形圖
const calorieChartOption = computed(() => {
  if (!props.data?.length) return {};

  const dates = props.data.map((d) => d.step_date?.slice(5) || d.step_date);
  const basalData = props.data.map((d) => d.calorie?.[0] || 0);
  const activeData = props.data.map((d) => d.calorie?.[1] || 0);

  return {
    title: {
      text: '每日卡路里消耗',
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#303133' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const basal = params[0]?.value || 0;
        const active = params[1]?.value || 0;
        return `
          <div style="font-weight: 600; margin-bottom: 6px;">${params[0].name}</div>
          <div style="color: #67c23a;">🔥 基礎消耗: <strong>${Math.round(basal)} kcal</strong></div>
          <div style="color: #e6a23c;">🏃 活動消耗: <strong>${Math.round(active)} kcal</strong></div>
          <div style="color: #303133; margin-top: 4px;">合計: <strong>${Math.round(basal + active)} kcal</strong></div>
        `;
      },
    },
    legend: { data: ['基礎消耗', '活動消耗'], top: 30, textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '22%', containLabel: true },
    xAxis: {
      type: 'category', data: dates,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      axisLabel: { color: '#606266', fontSize: 11 },
    },
    yAxis: {
      type: 'value', name: 'kcal',
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [
      {
        name: '基礎消耗', type: 'bar', stack: 'total', data: basalData, barWidth: '40%',
        itemStyle: { color: '#67c23a', borderRadius: [0, 0, 0, 0] },
      },
      {
        name: '活動消耗', type: 'bar', stack: 'total', data: activeData, barWidth: '40%',
        itemStyle: { color: '#e6a23c', borderRadius: [6, 6, 0, 0] },
      },
    ],
  };
});

// 運動類型分布圖
const exerciseTypeOption = computed(() => {
  if (!stepStats.value || stepStats.value.totalMinutes === 0) return {};

  return {
    title: {
      text: '運動類型分布',
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#303133' },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      formatter: (params: any) => `
        <div style="font-weight: 600;">${params.name}</div>
        <div style="margin-top: 4px;">${params.value} 分鐘 (${params.percent}%)</div>
      `,
    },
    legend: { orient: 'horizontal', bottom: 5, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, lineHeight: 14 },
      labelLine: { length: 10, length2: 8 },
      data: [
        { value: stepStats.value.walking, name: '日常走路', itemStyle: { color: '#409eff' } },
        { value: stepStats.value.briskWalk, name: '健走', itemStyle: { color: '#67c23a' } },
        { value: stepStats.value.running, name: '跑步', itemStyle: { color: '#e6a23c' } },
      ],
    }],
  };
});
</script>

<template lang="pug">
.activity-chart
  template(v-if="data?.length")
    //- 活動總覽
    .stats-summary
      .stats-card.steps-stats
        .stats-header
          span.stats-icon 🚶
          span.stats-title 步數統計
        .stats-body(v-if="activitySummary")
          .stat-row
            .stat-item
              .stat-label 總步數
              .stat-value {{ formatNumber(activitySummary.totalSteps) }}
            .stat-item
              .stat-label 日均步數
              .stat-value(:class="getStepLevel(activitySummary.avgSteps).type") {{ formatNumber(activitySummary.avgSteps) }}
            .stat-item
              .stat-label 最高單日
              .stat-value.success {{ formatNumber(activitySummary.maxSteps) }}
          .stat-row
            .stat-item
              .stat-label 最低單日
              .stat-value {{ formatNumber(activitySummary.minSteps) }}
            .stat-item
              .stat-label 達標天數
              .stat-value {{ activitySummary.achievedDays }}/{{ activitySummary.totalDays }} 天
            .stat-item
              .stat-label 達標率
              .stat-value(:class="Number(activitySummary.achievedPercent) >= 70 ? 'success' : 'warning'") {{ activitySummary.achievedPercent }}%

      .stats-card.calorie-stats
        .stats-header
          span.stats-icon 🔥
          span.stats-title 卡路里統計
        .stats-body(v-if="activitySummary")
          .stat-row
            .stat-item
              .stat-label 總消耗
              .stat-value {{ formatNumber(activitySummary.totalCalories) }} kcal
            .stat-item
              .stat-label 基礎消耗
              .stat-value.success {{ formatNumber(activitySummary.totalBasal) }} kcal
            .stat-item
              .stat-label 活動消耗
              .stat-value.warning {{ formatNumber(activitySummary.totalActive) }} kcal
          .stat-row(v-if="stepStats && stepStats.totalMinutes > 0")
            .stat-item
              .stat-label 日常走路
              .stat-value {{ stepStats.walking }} 分鐘
            .stat-item
              .stat-label 健走
              .stat-value {{ stepStats.briskWalk }} 分鐘
            .stat-item
              .stat-label 跑步
              .stat-value {{ stepStats.running }} 分鐘

    //- 圖表區
    .charts-grid
      .chart-container
        v-chart.chart(:option="stepChartOption" autoresize)
      .chart-container
        v-chart.chart(:option="calorieChartOption" autoresize)

    //- 運動類型圓餅圖（只在有數據時顯示）
    .exercise-section(v-if="stepStats && stepStats.totalMinutes > 0")
      .chart-container.exercise-chart
        v-chart.chart(:option="exerciseTypeOption" autoresize)

  el-empty(v-else description="暫無活動數據")
</template>

<style scoped lang="scss">
.activity-chart {
  width: 100%;

  .stats-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .stats-card {
    background: var(--el-bg-color);
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    &.steps-stats { border-left: 4px solid #409eff; }
    &.calorie-stats { border-left: 4px solid #e6a23c; }
  }

  .stats-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .stats-icon { font-size: 18px; }
    .stats-title { font-weight: 600; font-size: 15px; color: var(--el-text-color-primary); }
  }

  .stat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;

    &:last-child { margin-bottom: 0; }
  }

  .stat-item {
    flex: 1;
    min-width: 80px;
    text-align: center;

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      &.success { color: #67c23a; }
      &.warning { color: #e6a23c; }
      &.danger { color: #f56c6c; }
      &.primary { color: #409eff; }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .chart-container {
    background: var(--el-bg-color);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .chart {
    width: 100%;
    height: 300px;
  }

  .exercise-section {
    .exercise-chart {
      max-width: 450px;
      margin: 0 auto;
    }
  }
}
</style>
