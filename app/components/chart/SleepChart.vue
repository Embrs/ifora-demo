<script setup lang="ts">
/**
 * 睡眠分析圖表組件
 * @description 顯示睡眠階段、睡眠評分等數據，增強統計顯示
 */
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, GaugeChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  PieChart,
  GaugeChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

// Props
interface SleepData {
  meter_sn: string;
  start_time: string;
  end_time: string;
  sleep_dur: string;
  sleep_data: string;
  stage_summary: string;
  sleep_score: string;
  sleep_mvmt: string;
  stg_count?: number;
}

interface ParsedStageSummary {
  totalMinutes: number;
  deepRatio: number;
  lightRatio: number;
  remRatio: number;
  awakeRatio: number;
}

interface ParsedSleepScore {
  totalScore: number;
  totalTimeScore: number;
  deepSleepScore: number;
  awakeRatioScore: number;
  bodyQuietScore: number;
}

const props = defineProps<{
  data: SleepData[];
  title?: string;
}>();

// 解析睡眠總覽
const parseStageSummary = (summary: string): ParsedStageSummary | null => {
  try {
    const arr = JSON.parse(summary);
    return {
      totalMinutes: arr[0] || 0,
      deepRatio: arr[1] || 0,
      lightRatio: arr[2] || 0,
      remRatio: arr[3] || 0,
      awakeRatio: arr[4] || 0,
    };
  } catch {
    return null;
  }
};

// 解析睡眠評分
const parseSleepScore = (score: string): ParsedSleepScore | null => {
  try {
    const arr = JSON.parse(score);
    return {
      totalScore: arr[0] || 0,
      totalTimeScore: arr[1] || 0,
      deepSleepScore: arr[2] || 0,
      awakeRatioScore: arr[3] || 0,
      bodyQuietScore: arr[4] || 0,
    };
  } catch {
    return null;
  }
};

// 取得最新的睡眠數據
const latestSleep = computed(() => {
  if (!props.data?.length) return null;
  return props.data[0];
});

const stageSummary = computed(() => {
  if (!latestSleep.value) return null;
  return parseStageSummary(latestSleep.value.stage_summary);
});

const sleepScore = computed(() => {
  if (!latestSleep.value) return null;
  return parseSleepScore(latestSleep.value.sleep_score);
});

// 睡眠評分儀表盤配置
const scoreGaugeOption = computed(() => {
  if (!sleepScore.value) return {};

  const score = sleepScore.value.totalScore;
  const color = score >= 80 ? '#67c23a' : score >= 60 ? '#e6a23c' : '#f56c6c';

  return {
    title: {
      text: '睡眠評分',
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#303133',
      },
    },
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        radius: '85%',
        center: ['50%', '60%'],
        axisLine: {
          lineStyle: {
            width: 18,
            color: [
              [0.5, {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#f56c6c' },
                  { offset: 1, color: '#f78989' },
                ],
              }],
              [0.75, {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#e6a23c' },
                  { offset: 1, color: '#eebe77' },
                ],
              }],
              [1, {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#67c23a' },
                  { offset: 1, color: '#95d475' },
                ],
              }],
            ],
          },
        },
        pointer: {
          itemStyle: { color: '#303133' },
          width: 5,
          length: '60%',
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          fontSize: 32,
          fontWeight: 'bold',
          formatter: '{value}',
          color,
          offsetCenter: [0, '10%'],
        },
        data: [{ value: Math.round(score) }],
      },
    ],
  };
});

// 睡眠階段圓餅圖配置
const stageChartOption = computed(() => {
  if (!stageSummary.value) return {};

  const { deepRatio, lightRatio, remRatio, awakeRatio } = stageSummary.value;

  return {
    title: {
      text: '睡眠階段分布',
      left: 'center',
      top: 5,
      textStyle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#303133',
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#303133' },
      formatter: (params: any) => `
        <div style="font-weight: 600; color: #303133;">${params.name}</div>
        <div style="margin-top: 4px;">💤 ${params.percent}%</div>
      `,
    },
    legend: {
      orient: 'horizontal',
      bottom: 5,
      textStyle: { color: '#606266', fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 3,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#606266',
          fontSize: 11,
          lineHeight: 14,
        },
        labelLine: {
          length: 12,
          length2: 8,
        },
        data: [
          {
            value: +(deepRatio * 100).toFixed(1),
            name: '深睡',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#409eff' },
                  { offset: 1, color: '#66b1ff' },
                ],
              },
            },
          },
          {
            value: +(lightRatio * 100).toFixed(1),
            name: '淺睡',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#67c23a' },
                  { offset: 1, color: '#95d475' },
                ],
              },
            },
          },
          {
            value: +(remRatio * 100).toFixed(1),
            name: 'REM',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#e6a23c' },
                  { offset: 1, color: '#eebe77' },
                ],
              },
            },
          },
          {
            value: +(awakeRatio * 100).toFixed(1),
            name: '清醒',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#f56c6c' },
                  { offset: 1, color: '#f89898' },
                ],
              },
            },
          },
        ],
      },
    ],
  };
});

// 格式化時間
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} 小時 ${mins} 分鐘`;
};

// 取得睡眠品質評級
const getSleepQuality = (score: number) => {
  if (score >= 85) return { label: '優秀', type: 'success' as const };
  if (score >= 70) return { label: '良好', type: 'primary' as const };
  if (score >= 55) return { label: '一般', type: 'warning' as const };
  return { label: '較差', type: 'danger' as const };
};
</script>

<template lang="pug">
.sleep-chart
  template(v-if="latestSleep")
    //- 睡眠總覽統計
    .stats-summary
      .stats-card.time-stats
        .stats-header
          span.stats-icon 🛏️
          span.stats-title 睡眠時間
        .stats-body
          .stat-row
            .stat-item
              .stat-label 入睡時間
              .stat-value {{ latestSleep.start_time?.split(' ')[1] || latestSleep.start_time }}
            .stat-item
              .stat-label 醒來時間
              .stat-value {{ latestSleep.end_time?.split(' ')[1] || latestSleep.end_time }}
            .stat-item
              .stat-label 睡眠時長
              .stat-value.primary {{ latestSleep.sleep_dur || (stageSummary ? formatDuration(stageSummary.totalMinutes) : '-') }}

      .stats-card.quality-stats(v-if="sleepScore")
        .stats-header
          span.stats-icon ⭐
          span.stats-title 睡眠品質
        .stats-body
          .stat-row
            .stat-item
              .stat-label 總評分
              .stat-value(:class="getSleepQuality(sleepScore.totalScore).type") {{ Math.round(sleepScore.totalScore) }} 分
            .stat-item
              .stat-label 睡眠時長評分
              .stat-value {{ Math.round(sleepScore.totalTimeScore) }}
            .stat-item
              .stat-label 深睡評分
              .stat-value {{ Math.round(sleepScore.deepSleepScore) }}
          .stat-row
            .stat-item
              .stat-label 清醒比評分
              .stat-value {{ Math.round(sleepScore.awakeRatioScore) }}
            .stat-item
              .stat-label 身體安靜度
              .stat-value {{ Math.round(sleepScore.bodyQuietScore) }}
            .stat-item
              .stat-label 品質等級
              el-tag(:type="getSleepQuality(sleepScore.totalScore).type" size="small")
                | {{ getSleepQuality(sleepScore.totalScore).label }}
    
    //- 圖表區
    .charts-grid
      .chart-container
        v-chart.chart(:option="scoreGaugeOption" autoresize)
      .chart-container
        v-chart.chart(:option="stageChartOption" autoresize)
    
    //- 睡眠階段詳情
    .stage-details(v-if="stageSummary")
      .stats-card.stage-card
        .stats-header
          span.stats-icon 📊
          span.stats-title 睡眠階段詳情
        .stage-bars
          .stage-bar
            .stage-info
              .stage-label 深睡
              .stage-percent {{ (stageSummary.deepRatio * 100).toFixed(1) }}%
            el-progress(
              :percentage="+(stageSummary.deepRatio * 100).toFixed(1)"
              :stroke-width="18"
              color="#5470c6"
              :show-text="false"
            )
            .stage-time {{ formatDuration(stageSummary.totalMinutes * stageSummary.deepRatio) }}
          .stage-bar
            .stage-info
              .stage-label 淺睡
              .stage-percent {{ (stageSummary.lightRatio * 100).toFixed(1) }}%
            el-progress(
              :percentage="+(stageSummary.lightRatio * 100).toFixed(1)"
              :stroke-width="18"
              color="#91cc75"
              :show-text="false"
            )
            .stage-time {{ formatDuration(stageSummary.totalMinutes * stageSummary.lightRatio) }}
          .stage-bar
            .stage-info
              .stage-label REM
              .stage-percent {{ (stageSummary.remRatio * 100).toFixed(1) }}%
            el-progress(
              :percentage="+(stageSummary.remRatio * 100).toFixed(1)"
              :stroke-width="18"
              color="#fac858"
              :show-text="false"
            )
            .stage-time {{ formatDuration(stageSummary.totalMinutes * stageSummary.remRatio) }}
          .stage-bar
            .stage-info
              .stage-label 清醒
              .stage-percent {{ (stageSummary.awakeRatio * 100).toFixed(1) }}%
            el-progress(
              :percentage="+(stageSummary.awakeRatio * 100).toFixed(1)"
              :stroke-width="18"
              color="#ee6666"
              :show-text="false"
            )
            .stage-time {{ formatDuration(stageSummary.totalMinutes * stageSummary.awakeRatio) }}
  
  el-empty(v-else description="暫無睡眠數據")
</template>

<style scoped lang="scss">
.sleep-chart {
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

    &.time-stats { border-left: 4px solid #409eff; }
    &.quality-stats { border-left: 4px solid #67c23a; }
    &.stage-card { border-left: 4px solid #e6a23c; }
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
      &.primary { color: #409eff; }
      &.warning { color: #e6a23c; }
      &.danger { color: #f56c6c; }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .chart-container {
    background: var(--el-bg-color);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .chart {
    width: 100%;
    height: 250px;
  }

  .stage-details {
    .stage-bars {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .stage-bar {
      display: grid;
      grid-template-columns: 100px 1fr 100px;
      align-items: center;
      gap: 12px;

      .stage-info {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stage-label {
        font-weight: 500;
        font-size: 14px;
      }

      .stage-percent {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }

      .stage-time {
        text-align: right;
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
    }
  }
}
</style>
