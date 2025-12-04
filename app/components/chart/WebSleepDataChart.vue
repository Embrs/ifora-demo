<template lang="pug">
.web-sleep-data-chart(v-if="hasData")
  //- 摘要統計卡片
  .summary-section
    .summary-header
      .summary-title 睡眠血氧濃度報告
      .summary-badge(:class="odiLevel.class") {{ odiLevel.text }}
    
    .summary-grid
      //- 基本資訊
      .stat-group
        .stat-group-title 基本資訊
        .stat-row
          .stat-item
            .stat-label 總記錄時間
            .stat-value {{ formatDuration(summary.duration) }}
          .stat-item
            .stat-label 平均血氧
            .stat-value {{ summary.avgSpO2.toFixed(1) }}%
          .stat-item
            .stat-label 最低血氧
            .stat-value(:class="{ 'warning': summary.minSpO2 < 90 }") {{ summary.minSpO2 }}%
      
      //- 血氧下降事件
      .stat-group
        .stat-group-title 血氧下降事件
        .stat-row
          .stat-item
            .stat-label 下降 ≥3% 次數
            .stat-value {{ oxygenEvents.drop3Count }}
          .stat-item
            .stat-label 下降 ≥4% 次數
            .stat-value {{ oxygenEvents.drop4Count }}
          .stat-item
            .stat-label 血氧 &lt;90% 時間
            .stat-value {{ formatSeconds(oxygenEvents.below90Duration) }}
      
      //- ODI 指標
      .stat-group
        .stat-group-title ODI 指標
        .stat-row
          .stat-item
            .stat-label ODI 3% (次數/小時)
            .stat-value {{ oxygenEvents.odi3.toFixed(1) }}
          .stat-item
            .stat-label ODI 4% (次數/小時)
            .stat-value {{ oxygenEvents.odi4.toFixed(1) }}
          .stat-item
            .stat-label CT90 (%)
            .stat-value {{ oxygenEvents.ct90.toFixed(2) }}
      
      //- 心率資訊
      .stat-group
        .stat-group-title 心率資訊
        .stat-row
          .stat-item
            .stat-label 平均心率
            .stat-value {{ summary.avgHR.toFixed(0) }} bpm
          .stat-item
            .stat-label 最低心率
            .stat-value {{ summary.minHR }} bpm
          .stat-item
            .stat-label 最高心率
            .stat-value {{ summary.maxHR }} bpm
  
  //- 血氧圖表
  .chart-section
    .chart-title 血氧 (SpO2) 趨勢
    .chart-container
      VChart.chart(:option="spo2ChartOption" autoresize)
  
  //- 心率圖表
  .chart-section
    .chart-title 心率 (HR) 趨勢
    .chart-container
      VChart.chart(:option="hrChartOption" autoresize)
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

interface Props {
  data: string[];
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '睡眠監測數據',
});

// 解析數據
interface DataPoint {
  spo2: number;
  hr: number;
  status: number;
  time: string;
  timestamp: number;
}

// 官方摘要數據（從 API 第一行解析）
interface OfficialSummary {
  minSpO2: number;
  odi3: number;
  odi4: number;
  ct90: number;
}

const officialSummary = computed<OfficialSummary>(() => {
  if (!props.data || props.data.length < 1) {
    return { minSpO2: 0, odi3: 0, odi4: 0, ct90: 0 };
  }
  
  // 第一行是摘要數據：最低血氧,ODI3%,ODI4%,CT90
  const firstRow = props.data[0] || '';
  const parts = firstRow.split(',').map((s) => parseFloat(s.trim()));
  return {
    minSpO2: parts[0] || 0,
    odi3: parts[1] || 0,
    odi4: parts[2] || 0,
    ct90: parts[3] || 0,
  };
});

const parsedData = computed<DataPoint[]>(() => {
  if (!props.data || props.data.length < 2) return [];
  
  // 跳過第一行（摘要）
  return props.data.slice(1)
    .map((row) => {
      const parts = row.split(',').map((s) => parseInt(s.trim(), 10));
      if (parts.length < 4) return null;
      
      const [spo2 = 0, hr = 0, status = 0, rawTime = 0] = parts;
      // 解析時間：14620 -> 01:46:20
      const timeStr = rawTime.toString().padStart(5, '0');
      const hours = parseInt(timeStr.slice(0, -4) || '0', 10);
      const mins = parseInt(timeStr.slice(-4, -2), 10);
      const secs = parseInt(timeStr.slice(-2), 10);
      const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      return {
        spo2,
        hr,
        status,
        time,
        timestamp: hours * 3600 + mins * 60 + secs,
      };
    })
    .filter((d): d is DataPoint => d !== null && d.spo2 > 0); // 過濾無效數據
});

// 統計摘要
const summary = computed(() => {
  const data = parsedData.value;
  const official = officialSummary.value;
  
  if (data.length === 0) {
    return { avgSpO2: 0, minSpO2: official.minSpO2, avgHR: 0, minHR: 0, maxHR: 0, duration: 0 };
  }
  
  const validData = data.filter((d) => d.spo2 > 0 && d.hr > 0);
  const spo2Values = validData.map((d) => d.spo2);
  const hrValues = validData.map((d) => d.hr);
  
  // 使用原始數據長度（含無效數據）作為時間（秒）
  // 因為每個數據點代表 1 秒
  const rawDataLength = props.data.length - 1; // 減去摘要行
  const duration = rawDataLength;
  
  return {
    avgSpO2: spo2Values.length > 0 ? spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length : 0,
    minSpO2: official.minSpO2, // 使用官方最低血氧
    avgHR: hrValues.length > 0 ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length : 0,
    minHR: hrValues.length > 0 ? Math.min(...hrValues) : 0,
    maxHR: hrValues.length > 0 ? Math.max(...hrValues) : 0,
    duration,
  };
});

// 血氧下降事件計算（使用官方數據）
const oxygenEvents = computed(() => {
  const official = officialSummary.value;
  const durationHours = summary.value.duration / 3600;
  
  // 從官方 ODI 反算下降次數
  const drop3Count = Math.round(official.odi3 * durationHours);
  const drop4Count = Math.round(official.odi4 * durationHours);
  
  // 從官方 CT90 反算血氧<90%時間
  const data = parsedData.value;
  const below90Duration = Math.round((official.ct90 / 100) * data.length);
  
  return {
    drop3Count,
    drop4Count,
    below90Duration,
    odi3: official.odi3,
    odi4: official.odi4,
    ct90: official.ct90,
  };
});

// ODI 等級判定
const odiLevel = computed(() => {
  const odi = oxygenEvents.value.odi4;
  if (odi < 5) return { text: '正常', class: 'level-normal' };
  if (odi < 15) return { text: '輕度', class: 'level-mild' };
  if (odi < 30) return { text: '中度', class: 'level-moderate' };
  return { text: '重度', class: 'level-severe' };
});

const hasData = computed(() => parsedData.value.length > 0);

// 格式化時間
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小時${mins}分鐘`;
  }
  return `${mins}分鐘`;
};

// 格式化秒數
const formatSeconds = (seconds: number) => {
  if (seconds === 0) return '0秒';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分鐘`;
  }
  return `${secs}秒`;
};

// 採樣數據以提高性能
const sampledData = computed(() => {
  const data = parsedData.value;
  const maxPoints = 500;
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => (i % step === 0));
});

// 血氧圖表配置
const spo2ChartOption = computed(() => {
  const data = sampledData.value;
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const time = params[0]?.axisValue || '';
        const value = params[0]?.value || 0;
        return `<div style="font-weight: 600;">時間: ${time}</div>
                <div style="color: #f56c6c; margin-top: 4px;">血氧: ${value}%</div>`;
      },
    },
    grid: { left: 50, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.time),
      axisLabel: { color: '#909399', fontSize: 9, interval: Math.floor(data.length / 8) },
      axisLine: { lineStyle: { color: '#e4e7ed' } },
    },
    yAxis: {
      type: 'value',
      name: '血氧 (%)',
      min: 80,
      max: 100,
      nameTextStyle: { color: '#f56c6c', fontSize: 11 },
      axisLabel: { color: '#909399', fontSize: 10 },
      axisLine: { show: true, lineStyle: { color: '#f56c6c' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    dataZoom: [{ type: 'slider', bottom: 5, height: 18, borderColor: '#e4e7ed', fillerColor: 'rgba(245, 108, 108, 0.2)' }],
    series: [{
      type: 'line',
      data: data.map((d) => d.spo2),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: '#f56c6c', width: 1.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 108, 108, 0.2)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.02)' },
          ],
        },
      },
      markLine: {
        silent: true,
        lineStyle: { color: '#e6a23c', type: 'dashed', width: 1 },
        data: [{ yAxis: 90, label: { formatter: '90%', position: 'end', fontSize: 10 } }],
      },
    }],
  };
});

// 心率圖表配置
const hrChartOption = computed(() => {
  const data = sampledData.value;
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#303133' },
      formatter: (params: any) => {
        const time = params[0]?.axisValue || '';
        const value = params[0]?.value || 0;
        return `<div style="font-weight: 600;">時間: ${time}</div>
                <div style="color: #409eff; margin-top: 4px;">心率: ${value} bpm</div>`;
      },
    },
    grid: { left: 50, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.time),
      axisLabel: { color: '#909399', fontSize: 9, interval: Math.floor(data.length / 8) },
      axisLine: { lineStyle: { color: '#e4e7ed' } },
    },
    yAxis: {
      type: 'value',
      name: '心率 (bpm)',
      min: 40,
      max: 120,
      nameTextStyle: { color: '#409eff', fontSize: 11 },
      axisLabel: { color: '#909399', fontSize: 10 },
      axisLine: { show: true, lineStyle: { color: '#409eff' } },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    dataZoom: [{ type: 'slider', bottom: 5, height: 18, borderColor: '#e4e7ed', fillerColor: 'rgba(64, 158, 255, 0.2)' }],
    series: [{
      type: 'line',
      data: data.map((d) => d.hr),
      smooth: false,
      symbol: 'none',
      lineStyle: { color: '#409eff', width: 1.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.2)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.02)' },
          ],
        },
      },
    }],
  };
});
</script>

<style scoped lang="scss">
.web-sleep-data-chart {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.summary-section {
  margin-bottom: 20px;
  
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .summary-title {
    font-size: 18px;
    font-weight: 700;
    color: #303133;
  }
  
  .summary-badge {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    
    &.level-normal { background: #e1f3d8; color: #67c23a; }
    &.level-mild { background: #fdf6ec; color: #e6a23c; }
    &.level-moderate { background: #fef0f0; color: #f56c6c; }
    &.level-severe { background: #fde2e2; color: #c45656; }
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .stat-group {
    background: #fafafa;
    border-radius: 8px;
    padding: 12px 16px;
    border: 1px solid #f0f0f0;
    
    .stat-group-title {
      font-size: 13px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #e4e7ed;
    }
    
    .stat-row {
      display: flex;
      gap: 12px;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
      
      .stat-label {
        font-size: 11px;
        color: #909399;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        
        &.warning {
          color: #e6a23c;
        }
      }
    }
  }
}

.chart-section {
  margin-top: 20px;
  
  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }
  
  .chart-container {
    background: #fafafa;
    border-radius: 6px;
    padding: 12px 8px;
    border: 1px solid #f0f0f0;
    
    .chart {
      width: 100%;
      height: 200px;
    }
  }
}
</style>
