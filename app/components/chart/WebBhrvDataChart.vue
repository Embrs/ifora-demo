<template lang="pug">
.web-bhrv-data-chart(v-if="parsedData.length > 0")
  //- 報告標題
  .summary-section
    .summary-header
      h2.summary-title BHRV 共振呼吸報告
    
    //- 指標卡片
    .summary-grid
      //- 基本資訊
      .stat-group
        .stat-group-title 基本資訊
        .stat-row
          .stat-item
            .stat-label 總記錄時間
            .stat-value {{ formatDuration(summary.duration) }}
          .stat-item
            .stat-label 平均心率
            .stat-value {{ Math.round(summary.avgHR) }} bpm
      
      //- 呼吸指標
      .stat-group
        .stat-group-title 共振呼吸指標
        .stat-row
          .stat-item
            .stat-label 平均呼吸率
            .stat-value {{ summary.avgBreathRate.toFixed(1) }} /min
          .stat-item
            .stat-label 共振得分
            .stat-value {{ summary.coherenceScore.toFixed(1) }}
  
  //- 心率趨勢圖
  .chart-section
    .chart-title 心率趨勢
    .chart-container
      VChart.chart(:option="hrChartOption" autoresize)
  
  //- 呼吸率趨勢圖
  .chart-section(v-if="breathData.length > 0")
    .chart-title 呼吸率趨勢
    .chart-container
      VChart.chart(:option="breathChartOption" autoresize)
</template>

<script setup lang="ts">
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
]);

// Props
const props = defineProps<{
  data: string[];
  title?: string;
}>();

// 解析數據
interface DataPoint {
  hr: number;
  breathRate: number;
  coherence: number;
  time: string;
  timestamp: number;
}

const parsedData = computed<DataPoint[]>(() => {
  if (!props.data || props.data.length < 1) return [];
  
  return props.data
    .map((row) => {
      const parts = row.split(',').map((s) => s.trim());
      if (parts.length < 3) return null;
      
      // 假設格式: HR,呼吸率,coherence,timestamp 或類似格式
      const hr = parseFloat(parts[0] || '0') || 0;
      const breathRate = parseFloat(parts[1] || '0') || 0;
      const coherence = parseFloat(parts[2] || '0') || 0;
      const rawTime = parseInt(parts[3] || parts[2] || '0') || 0;
      
      // 解析時間
      const timeStr = rawTime.toString().padStart(5, '0');
      const hours = parseInt(timeStr.slice(0, -4) || '0', 10);
      const mins = parseInt(timeStr.slice(-4, -2), 10);
      const secs = parseInt(timeStr.slice(-2), 10);
      const time = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      
      return {
        hr,
        breathRate,
        coherence,
        time,
        timestamp: hours * 3600 + mins * 60 + secs,
      };
    })
    .filter((d): d is DataPoint => d !== null && d.hr > 0);
});

// 呼吸數據
const breathData = computed(() => {
  return parsedData.value.filter((d) => d.breathRate > 0);
});

// 統計摘要
const summary = computed(() => {
  const data = parsedData.value;
  if (data.length === 0) {
    return { avgHR: 0, duration: 0, avgBreathRate: 0, coherenceScore: 0 };
  }
  
  const hrValues = data.map((d) => d.hr).filter((v) => v > 0);
  const breathValues = breathData.value.map((d) => d.breathRate).filter((v) => v > 0);
  const coherenceValues = data.map((d) => d.coherence).filter((v) => v > 0);
  
  const duration = data.length;
  const avgHR = hrValues.length > 0 ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length : 0;
  const avgBreathRate = breathValues.length > 0 ? breathValues.reduce((a, b) => a + b, 0) / breathValues.length : 0;
  const coherenceScore = coherenceValues.length > 0 ? coherenceValues.reduce((a, b) => a + b, 0) / coherenceValues.length : 0;
  
  return { avgHR, duration, avgBreathRate, coherenceScore };
});

// 格式化時間
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小時${mins}分鐘`;
  }
  return `${mins}分鐘`;
};

// 採樣數據
const sampleData = (data: DataPoint[], maxPoints: number = 500) => {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
};

// 心率圖表配置
const hrChartOption = computed(() => {
  const sampled = sampleData(parsedData.value);
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `時間: ${data.name}<br/>心率: ${data.value} bpm`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sampled.map((d) => d.time),
      axisLabel: { rotate: 0, interval: 'auto' },
    },
    yAxis: {
      type: 'value',
      name: '心率 (bpm)',
      min: 40,
      max: 120,
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100,
    }, {
      type: 'slider',
      start: 0,
      end: 100,
    }],
    series: [{
      name: '心率',
      type: 'line',
      data: sampled.map((d) => d.hr),
      smooth: true,
      lineStyle: { color: '#E6A23C', width: 1.5 },
      areaStyle: { color: 'rgba(230, 162, 60, 0.1)' },
      symbol: 'none',
    }],
  };
});

// 呼吸率圖表配置
const breathChartOption = computed(() => {
  const sampled = sampleData(breathData.value);
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `時間: ${data.name}<br/>呼吸率: ${data.value} /min`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sampled.map((d) => d.time),
      axisLabel: { rotate: 0, interval: 'auto' },
    },
    yAxis: {
      type: 'value',
      name: '呼吸率 (/min)',
    },
    dataZoom: [{
      type: 'inside',
      start: 0,
      end: 100,
    }, {
      type: 'slider',
      start: 0,
      end: 100,
    }],
    series: [{
      name: '呼吸率',
      type: 'line',
      data: sampled.map((d) => d.breathRate),
      smooth: true,
      lineStyle: { color: '#67C23A', width: 1.5 },
      areaStyle: { color: 'rgba(103, 194, 58, 0.1)' },
      symbol: 'none',
    }],
  };
});
</script>

<style scoped lang="scss">
.web-bhrv-data-chart {
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
    border-left: 3px solid #e6a23c;
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
