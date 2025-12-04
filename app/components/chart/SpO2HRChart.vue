<script setup lang="ts">
/**
 * 血氧心率圖表組件
 * @description 顯示血氧 (SpO2) 和心率 (HR) 的時間序列數據，分離顯示並提供詳細統計
 */
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
} from 'echarts/components';
import VChart from 'vue-echarts';

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  MarkLineComponent,
]);

// Props
interface SpO2HRData {
  meter_sn: string;
  spo2: number;
  hr: number;
  datetime: string;
  quality?: number;
  hear_rate_grade?: number;
  d?: string;
}

const props = defineProps<{
  data: SpO2HRData[];
  title?: string;
}>();

// 排序後的數據
const sortedData = computed(() => {
  if (!props.data?.length) return [];
  return [...props.data].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
});

// 血氧統計
const spo2Stats = computed(() => {
  const validData = sortedData.value.filter((d) => d.spo2 > 0);
  if (!validData.length) return null;

  const values = validData.map((d) => d.spo2);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // 低於 90% 的次數和時間（假設每個數據點間隔約 1 分鐘）
  const below90Count = values.filter((v) => v < 90).length;
  const below90Percent = (below90Count / values.length) * 100;

  // 低於 95% 的次數
  const below95Count = values.filter((v) => v < 95).length;
  const below95Percent = (below95Count / values.length) * 100;

  return {
    min,
    max,
    avg: avg.toFixed(1),
    below90Count,
    below90Percent: below90Percent.toFixed(1),
    below95Count,
    below95Percent: below95Percent.toFixed(1),
    totalCount: values.length,
  };
});

// 心率統計
const hrStats = computed(() => {
  const validData = sortedData.value.filter((d) => d.hr > 0);
  if (!validData.length) return null;

  const values = validData.map((d) => d.hr);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // 心率範圍分類
  const lowCount = values.filter((v) => v < 60).length;
  const normalCount = values.filter((v) => v >= 60 && v <= 100).length;
  const highCount = values.filter((v) => v > 100).length;

  return {
    min,
    max,
    avg: avg.toFixed(0),
    lowCount,
    normalCount,
    highCount,
    totalCount: values.length,
  };
});

// 血氧等級判斷
const getSpO2Level = (value: number) => {
  if (value >= 95) return { label: '正常', type: 'success' as const };
  if (value >= 90) return { label: '偏低', type: 'warning' as const };
  return { label: '過低', type: 'danger' as const };
};

// 心率等級判斷
const getHRLevel = (value: number) => {
  if (value < 60) return { label: '偏慢', type: 'info' as const };
  if (value <= 100) return { label: '正常', type: 'success' as const };
  return { label: '偏快', type: 'warning' as const };
};

// 血氧圖表配置
const spo2ChartOption = computed(() => {
  if (!sortedData.value.length) return {};

  const times = sortedData.value.map((d) => d.datetime.split(' ')[1] || d.datetime);
  const spo2Values = sortedData.value.map((d) => d.spo2 || null);
  const minValue = spo2Stats.value?.min ?? 85;

  return {
    title: {
      text: '血氧飽和度 (SpO2)',
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#303133' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex;
        const item = sortedData.value[idx];
        if (!item) return '';
        const level = getSpO2Level(item.spo2);
        return `
          <div style="font-weight: 600; margin-bottom: 6px;">${item.datetime}</div>
          <div style="color: #409eff;">血氧: <strong>${item.spo2}%</strong> 
            <span style="color: ${level.type === 'success' ? '#67c23a' : level.type === 'warning' ? '#e6a23c' : '#f56c6c'};">(${level.label})</span>
          </div>
        `;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
    dataZoom: [
      {
        type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100,
        height: 22, bottom: 8, borderColor: '#e4e7ed', backgroundColor: '#fafafa',
        fillerColor: 'rgba(64, 158, 255, 0.15)',
      },
      { type: 'inside', xAxisIndex: [0] },
    ],
    xAxis: {
      type: 'category', data: times,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { rotate: 45, interval: Math.floor(times.length / 8), color: '#606266', fontSize: 10 },
    },
    yAxis: {
      type: 'value', name: '%', min: Math.max(minValue - 5, 70), max: 100,
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLine: { show: true, lineStyle: { color: '#409eff' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'line', data: spo2Values, smooth: 0.3, symbol: 'none',
      lineStyle: { width: 2, color: '#409eff' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(64, 158, 255, 0.25)' }, { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }],
        },
      },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { type: 'dashed', width: 1 },
        label: { position: 'insideEndTop', fontSize: 10 },
        data: [
          { yAxis: 95, lineStyle: { color: '#e6a23c' }, label: { formatter: '95%', color: '#e6a23c' } },
          { yAxis: 90, lineStyle: { color: '#f56c6c' }, label: { formatter: '90%', color: '#f56c6c' } },
        ],
      },
    }],
  };
});

// 心率圖表配置
const hrChartOption = computed(() => {
  if (!sortedData.value.length) return {};

  const times = sortedData.value.map((d) => d.datetime.split(' ')[1] || d.datetime);
  const hrValues = sortedData.value.map((d) => d.hr || null);
  const minValue = hrStats.value?.min ?? 40;
  const maxValue = hrStats.value?.max ?? 140;

  return {
    title: {
      text: '心率 (HR)',
      left: 'center',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#303133' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex;
        const item = sortedData.value[idx];
        if (!item) return '';
        const level = getHRLevel(item.hr);
        return `
          <div style="font-weight: 600; margin-bottom: 6px;">${item.datetime}</div>
          <div style="color: #f56c6c;">心率: <strong>${item.hr} bpm</strong>
            <span style="color: ${level.type === 'success' ? '#67c23a' : level.type === 'warning' ? '#e6a23c' : '#909399'};">(${level.label})</span>
          </div>
        `;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
    dataZoom: [
      {
        type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100,
        height: 22, bottom: 8, borderColor: '#e4e7ed', backgroundColor: '#fafafa',
        fillerColor: 'rgba(245, 108, 108, 0.15)',
      },
      { type: 'inside', xAxisIndex: [0] },
    ],
    xAxis: {
      type: 'category', data: times,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: { rotate: 45, interval: Math.floor(times.length / 8), color: '#606266', fontSize: 10 },
    },
    yAxis: {
      type: 'value', name: 'bpm', min: Math.max(minValue - 10, 30), max: Math.min(maxValue + 10, 180),
      nameTextStyle: { color: '#909399', fontSize: 11 },
      axisLine: { show: true, lineStyle: { color: '#f56c6c' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [{
      type: 'line', data: hrValues, smooth: 0.3, symbol: 'none',
      lineStyle: { width: 2, color: '#f56c6c' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(245, 108, 108, 0.2)' }, { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }],
        },
      },
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { type: 'dashed', width: 1 },
        label: { position: 'insideEndTop', fontSize: 10 },
        data: [
          { yAxis: 60, lineStyle: { color: '#909399' }, label: { formatter: '60', color: '#909399' } },
          { yAxis: 100, lineStyle: { color: '#e6a23c' }, label: { formatter: '100', color: '#e6a23c' } },
        ],
      },
    }],
  };
});
</script>

<template lang="pug">
.spo2-hr-chart
  template(v-if="data?.length")
    //- 統計摘要
    .stats-summary
      .stats-card.spo2-stats
        .stats-header
          span.stats-icon 💨
          span.stats-title 血氧飽和度統計
        .stats-body(v-if="spo2Stats")
          .stat-row
            .stat-item
              .stat-label 平均值
              .stat-value {{ spo2Stats.avg }}%
            .stat-item
              .stat-label 最高值
              .stat-value.success {{ spo2Stats.max }}%
            .stat-item
              .stat-label 最低值
              .stat-value(:class="getSpO2Level(spo2Stats.min).type") {{ spo2Stats.min }}%
          .stat-row
            .stat-item
              .stat-label &lt;95% 低於
              .stat-value.warning {{ spo2Stats.below95Count }}
                small  次 ({{ spo2Stats.below95Percent }}%)
            .stat-item
              .stat-label &lt;90% 低於
              .stat-value.danger {{ spo2Stats.below90Count }}
                small  次 ({{ spo2Stats.below90Percent }}%)
            .stat-item
              .stat-label 數據筆數
              .stat-value {{ spo2Stats.totalCount }}
                small  筆

      .stats-card.hr-stats
        .stats-header
          span.stats-icon ❤️
          span.stats-title 心率統計
        .stats-body(v-if="hrStats")
          .stat-row
            .stat-item
              .stat-label 平均值
              .stat-value {{ hrStats.avg }} bpm
            .stat-item
              .stat-label 最高值
              .stat-value(:class="getHRLevel(hrStats.max).type") {{ hrStats.max }} bpm
            .stat-item
              .stat-label 最低值
              .stat-value(:class="getHRLevel(hrStats.min).type") {{ hrStats.min }} bpm
          .stat-row
            .stat-item
              .stat-label 偏慢 (&lt;60 bpm)
              .stat-value.info {{ hrStats.lowCount }}
                small  次
            .stat-item
              .stat-label 正常 (60-100 bpm)
              .stat-value.success {{ hrStats.normalCount }}
                small  次
            .stat-item
              .stat-label 偏快 (&gt;100 bpm)
              .stat-value.warning {{ hrStats.highCount }}
                small  次

    //- 圖表區
    .charts-grid
      .chart-container
        v-chart.chart(:option="spo2ChartOption" autoresize)
      .chart-container
        v-chart.chart(:option="hrChartOption" autoresize)

  el-empty(v-else description="暫無數據")
</template>

<style scoped lang="scss">
.spo2-hr-chart {
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

    &.spo2-stats { border-left: 4px solid #409eff; }
    &.hr-stats { border-left: 4px solid #f56c6c; }
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
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      small { font-size: 12px; font-weight: 400; color: var(--el-text-color-secondary); }

      &.success { color: #67c23a; }
      &.warning { color: #e6a23c; }
      &.danger { color: #f56c6c; }
      &.info { color: #909399; }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;
  }

  .chart-container {
    background: var(--el-bg-color);
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .chart {
    width: 100%;
    height: 320px;
  }
}
</style>
